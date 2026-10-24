import { Component, computed, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CpmsService } from './cpms.service';
import { Application, Company, Interview } from './models';

@Component({selector:'cpms-workspace',standalone:true,imports:[CommonModule,FormsModule,ReactiveFormsModule,RouterLink,RouterLinkActive],templateUrl:'./workspace.component.html'})
export class WorkspaceComponent implements OnInit, OnDestroy {
  readonly api=inject(CpmsService);
  private route=inject(ActivatedRoute); private router=inject(Router); private fb=inject(FormBuilder);
  readonly page=this.route.snapshot.url[0]?.path||'overview';
  readonly student=computed(()=>this.api.user()?.role==='STUDENT');
  readonly admin=computed(()=>this.api.user()?.role==='ADMIN');
  readonly staff=computed(()=>!this.student());
  readonly search=signal(''); readonly location=signal(''); readonly savedOnly=signal(false); readonly order=signal('recommended'); readonly status=signal('');
  readonly selectedCompany=signal<Company|null>(null);
  readonly candidateId=signal('');
  readonly dialog=signal<'company'|'schedule'|'withdraw'|'deleteCompany'|'cancelInterview'|null>(null);
  readonly confirmId=signal(0); readonly editId=signal(0); readonly submitted=signal(false);
  readonly today=new Date();
  readonly stages=['Applied','Shortlisted','Interview','Selected','Offered','Rejected'];
  private timer?: ReturnType<typeof setInterval>;
  private focus=()=>{if(!document.hidden&&!this.api.busy())void this.api.refresh();};
  @HostListener('document:keydown.escape') onEscape():void {this.selectedCompany.set(null);this.candidateId.set('');this.closeDialog();}
  readonly ownDrives=computed(()=>this.api.user()?.role==='RECRUITER'?this.api.drives().filter(c=>Number(c.id)===Number(this.api.user()?.company_id)):this.api.drives());
  readonly locations=computed(()=>[...new Set(this.ownDrives().map(c=>c.location))].sort());
  readonly filteredDrives=computed(()=>{
    const query=this.search().trim().toLowerCase();
    const items=this.ownDrives().filter(c=>(!query||`${c.name} ${c.position} ${c.tags?.join(' ')}`.toLowerCase().includes(query))&&(!this.location()||c.location===this.location())&&(!this.savedOnly()||this.api.saved().includes(c.id)));
    return items.sort((a,b)=>this.order()==='salary'?this.compensation(b.ctc)-this.compensation(a.ctc):this.order()==='deadline'?(a.deadline||'9999').localeCompare(b.deadline||'9999'):a.id-b.id);
  });
  readonly filteredApplications=computed(()=>this.api.applications().filter(a=>(!this.status()||a.status===this.status())&&`${this.api.candidate(a.student_id)?.name||a.student_name||a.student_id} ${this.api.company(a.company_id)?.name||''}`.toLowerCase().includes(this.search().trim().toLowerCase())));
  readonly activeApplications=computed(()=>this.api.applications().filter(a=>!['Rejected','Withdrawn'].includes(a.status)));
  readonly interviews=computed(()=>[...this.api.workspace().interviews].sort((a,b)=>a.at.localeCompare(b.at)));
  readonly upcoming=computed(()=>this.interviews().filter(i=>new Date(i.at)>=new Date()));
  readonly offerCount=computed(()=>this.api.applications().filter(a=>['Selected','Offered'].includes(a.status)).length);
  readonly candidate=computed(()=>this.api.candidate(this.candidateId()));
  readonly titles:Record<string,string>={overview:'Overview',opportunities:'Opportunities',applications:'Applications',interviews:'Interviews',profile:'Career profile',companies:'Company management',reports:'Placement reports',notifications:'Notifications'};
  readonly companyForm=this.fb.nonNullable.group({name:['',[Validators.required,Validators.maxLength(100)]],position:['',[Validators.required,Validators.maxLength(100)]],location:['',Validators.maxLength(100)],ctc:['',Validators.maxLength(50)],openings:[1,[Validators.required,Validators.min(0),Validators.max(100000),Validators.pattern(/^\d+$/)]],workMode:['Hybrid'],deadline:[''],skills:['',Validators.maxLength(255)],description:['',Validators.maxLength(2000)]});
  readonly scheduleForm=this.fb.nonNullable.group({applicationId:['',Validators.required],title:['',[Validators.required,Validators.maxLength(100)]],at:['',Validators.required],venue:['',[Validators.required,Validators.maxLength(300)]],duration:['45 minutes',Validators.required]});
  readonly profileForm=this.fb.nonNullable.group({name:['',[Validators.required,Validators.maxLength(100)]],phone:['',Validators.maxLength(20)],skills:['',Validators.maxLength(255)],headline:['',Validators.maxLength(120)],github:['',[Validators.maxLength(300),Validators.pattern(/^https?:\/\/[^\s]+$/)]],linkedin:['',[Validators.maxLength(300),Validators.pattern(/^https?:\/\/[^\s]+$/)]]});

  async ngOnInit():Promise<void>{
    await this.api.refresh();
    const p=this.api.profile();
    if(p)this.profileForm.patchValue({name:p.name,phone:p.phone||'',skills:p.skills||'',headline:p.headline||'',github:p.github||'',linkedin:p.linkedin||''});
    this.timer=setInterval(this.focus,15000); window.addEventListener('focus',this.focus);
  }
  ngOnDestroy():void{if(this.timer)clearInterval(this.timer);window.removeEventListener('focus',this.focus);}
  async logout():Promise<void>{if(await this.api.logout())await this.router.navigateByUrl('/login');}
  initials(name:string):string{return name.split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();}
  compensation(value:string):number {const n=parseFloat(value)||0;return value?.includes('month')?n*.12:n;}
  count(stage:string):number{return this.api.applications().filter(a=>a.status===stage).length;}
  percent(stage:string):number{return Math.max(3,this.count(stage)/Math.max(this.api.applications().length,1)*100);}
  deadlinePassed(c:Company):boolean{return !!c.deadline&&c.deadline<new Date().toLocaleDateString('en-CA');}
  apply(c:Company):void{void this.api.mutate('/api/applications','POST',{companyId:c.id},`Application submitted to ${c.name}.`);}
  openConfirm(type:'withdraw'|'deleteCompany'|'cancelInterview',id:number):void{this.confirmId.set(id);this.dialog.set(type);}
  async confirm():Promise<void>{
    const type=this.dialog();const id=this.confirmId();
    const url=type==='withdraw'?`/api/applications/${id}`:type==='deleteCompany'?`/api/companies/${id}`:`/api/workspace/interviews/${id}`;
    if(await this.api.mutate(url,'DELETE',undefined,type==='withdraw'?'Application withdrawn.':type==='deleteCompany'?'Company removed.':'Interview cancelled.'))this.closeDialog();
  }
  transitions(a:Application):string[]{
    if(this.admin())return this.stages.filter(x=>x!=='Applied'&&x!==a.status);
    return ({Applied:['Shortlisted','Rejected'],Shortlisted:['Interview','Rejected'],Interview:['Selected','Rejected'],Selected:['Offered','Rejected'],Offered:['Rejected']} as Record<string,string[]>)[a.status]||[];
  }
  advance(a:Application,event:Event):void{const select=event.target as HTMLSelectElement;const status=select.value;select.value='';if(status)void this.api.mutate(`/api/applications/${a.id}/status`,'PATCH',{status},`Application moved to ${status}.`);}
  openCompany(company?:Company):void{
    this.editId.set(company?.id||0);this.submitted.set(false);
    this.companyForm.reset({name:company?.name||'',position:company?.position||'',location:company?.location||'',ctc:company?.ctc||'',openings:company?.openings??1,workMode:company?.workMode||'Hybrid',deadline:company?.deadline||'',skills:company?.tags?.join(', ')||'',description:company?.description||''});this.dialog.set('company');
  }
  async saveCompany():Promise<void>{
    this.submitted.set(true);if(this.companyForm.invalid){this.companyForm.markAllAsTouched();return;}
    const values=this.companyForm.getRawValue();
    if(await this.api.mutate(`/api/companies${this.editId()?'/'+this.editId():''}`,this.editId()?'PUT':'POST',{...values,salary:values.ctc},'Company saved.'))this.closeDialog();
  }
  openSchedule():void{this.submitted.set(false);this.scheduleForm.reset({applicationId:'',title:'Technical discussion',at:'',venue:'',duration:'45 minutes'});this.dialog.set('schedule');}
  async saveSchedule():Promise<void>{
    this.submitted.set(true);if(this.scheduleForm.invalid){this.scheduleForm.markAllAsTouched();return;}
    const values=this.scheduleForm.getRawValue();const date=new Date(values.at);
    if(Number.isNaN(date.getTime())||date<=new Date()){this.api.error.set('Choose a future interview date and time.');return;}
    if(await this.api.mutate('/api/workspace/interviews','POST',{...values,applicationId:Number(values.applicationId),at:date.toISOString()},'Interview scheduled.'))this.closeDialog();
  }
  async saveProfile():Promise<void>{this.submitted.set(true);if(this.profileForm.invalid){this.profileForm.markAllAsTouched();return;}await this.api.mutate('/api/workspace/profile','PUT',this.profileForm.getRawValue(),'Career profile saved.');}
  markRead():void{void this.api.mutate('/api/workspace/notifications/read','PATCH',{},'Notifications marked as read.');}
  closeDialog():void{if(!this.api.busy()){this.dialog.set(null);this.submitted.set(false);}}
  exportApplications():void{
    const rows=[['Application ID','Student','Admission ID','Company','Position','Status','Applied date'],...this.filteredApplications().map(a=>[a.id,this.api.candidate(a.student_id)?.name||a.student_name||'',a.student_id,this.api.company(a.company_id)?.name||'',this.api.company(a.company_id)?.position||'',a.status,a.applied_date])];
    const csv=rows.map(row=>row.map(value=>{let text=String(value??'');if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}).join(',')).join('\r\n');
    this.download(csv,'SAMPLE001_CPMS_applications.csv','text/csv;charset=utf-8;');
  }
  calendar(i:Interview):void{
    const start=new Date(i.at),end=new Date(start.getTime()+(parseInt(i.duration)||45)*60000);
    const date=(d:Date)=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const escape=(s:string)=>s.replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;').replaceAll('\r','');
    this.download(['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CPMS Angular//Placement//EN','BEGIN:VEVENT',`UID:cpms-angular-${i.id}@local`,`DTSTAMP:${date(new Date())}`,`DTSTART:${date(start)}`,`DTEND:${date(end)}`,`SUMMARY:${escape(i.title)}`,`LOCATION:${escape(i.venue)}`,'END:VEVENT','END:VCALENDAR',''].join('\r\n'),`CPMS_interview_${i.id}.ics`,'text/calendar;charset=utf-8');
  }
  private download(content:string,name:string,type:string):void{const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
