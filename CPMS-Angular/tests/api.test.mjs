import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {randomBytes,createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../package.json',import.meta.url));
const mysql=require('mysql2/promise'),dotenv=require('dotenv');
const root=new URL('../',import.meta.url);
const local=dotenv.parse(await fs.readFile(new URL('.env',root)));
const admin=dotenv.parse(await fs.readFile(new URL('../CPMS-React/.env',root)));
const db=await mysql.createConnection({host:admin.DB_HOST||'localhost',port:Number(admin.DB_PORT||3306),user:admin.DB_USER,password:admin.DB_PASSWORD||''});
const name='cpms_angular_test_'+randomBytes(6).toString('hex');
const tables=['students','companies','applications','users','career_profiles','company_details','interviews','workspace_notifications'];
let child,created=false;
async function hash(database){const result={};for(const table of tables){const [rows]=await db.query('SELECT * FROM ??.?? ORDER BY 1',[database,table]);result[table]=createHash('sha256').update(JSON.stringify(rows)).digest('hex');}return result;}
const angularBefore=await hash(local.DB_NAME);
const reactBefore=await hash(admin.DB_NAME||'cpms');
await test('Angular Node.js API integration in an isolated disposable database',async t=>{
  try{
    await db.query('CREATE DATABASE ??',[name]);created=true;await db.query('USE ??',[name]);
    for(const table of tables){
      const [ddl]=await db.query('SHOW CREATE TABLE ??.??',[local.DB_NAME,table]);await db.query(ddl[0]['Create Table']);
      const [rows]=await db.query('SELECT * FROM ??.??',[local.DB_NAME,table]);for(const row of rows)await db.query('INSERT INTO ?? SET ?',[table,row]);
    }
    child=spawn(process.execPath,['backend/server.js'],{cwd:fileURLToPath(root),windowsHide:true,env:{...process.env,...admin,DB_NAME:name,JWT_SECRET:randomBytes(48).toString('hex'),PORT:'0'},stdio:['ignore','pipe','pipe']});
    let output='';child.stdout.on('data',b=>{output+=b;});child.stderr.on('data',b=>{output+=b;});
    for(let i=0;i<100&&!/http:\/\/localhost:\d+/.test(output);i++)await new Promise(r=>setTimeout(r,100));
    const match=output.match(/http:\/\/localhost:(\d+)/);assert.ok(match,output);const base=`http://127.0.0.1:${match[1]}`;
    const sessions={};
    async function request(role,url,method='GET',body){const response=await fetch(base+url,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(sessions[role]?{Cookie:sessions[role]}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')};}
    async function login(key,email){const r=await request('', '/api/auth/login','POST',{email,password:'CpmsDemo@2026'});assert.equal(r.status,200);assert.match(r.cookie,/^cpms_angular_token=/);assert.match(r.cookie,/HttpOnly/);sessions[key]=r.cookie.split(';')[0];return r.data.user;}
    await t.test('health and unauthenticated access',async()=>{assert.equal((await request('','/api/health')).data.database,'Connected');assert.equal((await request('','/api/workspace')).status,401);});
    await t.test('invalid credentials rejected',async()=>assert.equal((await request('','/api/auth/login','POST',{email:'student@cpms.local',password:'incorrect'})).status,401));
    await t.test('all classroom roles sign in using separate HttpOnly cookies',async()=>{assert.equal((await login('student','student@cpms.local')).student_id,'SAMPLE001');await login('recruiter','recruiter@cpms.local');await login('admin','admin@cpms.local');await login('other','priya@cpms.local');await login('recruiter2','recruiter2@cpms.local');});
    await t.test('student cannot read another student or create a company',async()=>{assert.equal((await request('student','/api/students/SAMPLE002')).status,403);assert.equal((await request('student','/api/companies','POST',{name:'Forbidden',position:'No'})).status,403);});
    let applicationId;
    await t.test('student applies and duplicate application is rejected',async()=>{const r=await request('student','/api/applications','POST',{companyId:1});assert.equal(r.status,201);applicationId=r.data.id;assert.equal((await request('student','/api/applications','POST',{companyId:1})).status,409);});
    await t.test('student cannot impersonate another student',async()=>assert.equal((await request('student','/api/applications','POST',{companyId:2,studentId:'SAMPLE002'})).status,403));
    await t.test('other recruiter cannot update this application',async()=>assert.equal((await request('recruiter2',`/api/applications/${applicationId}/status`,'PATCH',{status:'Shortlisted'})).status,403));
    await t.test('recruiter cannot skip selection stages',async()=>assert.equal((await request('recruiter',`/api/applications/${applicationId}/status`,'PATCH',{status:'Offered'})).status,400));
    await t.test('recruiter shortlist is visible to student in MySQL',async()=>{assert.equal((await request('recruiter',`/api/applications/${applicationId}/status`,'PATCH',{status:'Shortlisted'})).status,200);const r=await request('student','/api/students/SAMPLE001/applications/details');assert.equal(r.data.find(a=>a.id===applicationId).status,'Shortlisted');});
    let interviewId;
    await t.test('staff schedules official interview visible to candidate',async()=>{const r=await request('recruiter','/api/workspace/interviews','POST',{applicationId,title:'Integration technical interview',at:new Date(Date.now()+86400000).toISOString(),duration:'45 minutes',venue:'Room 204'});assert.equal(r.status,201);interviewId=r.data.id;assert.ok((await request('student','/api/workspace')).data.interviews.some(i=>i.id===interviewId));});
    await t.test('student cannot cancel official interview and other student cannot schedule it',async()=>{assert.equal((await request('student',`/api/workspace/interviews/${interviewId}`,'DELETE')).status,403);assert.equal((await request('other','/api/workspace/interviews','POST',{applicationId,title:'No',at:new Date(Date.now()+86400000).toISOString(),duration:'45 minutes',venue:'No'})).status,403);});
    await t.test('personal preparation is private to its creator',async()=>{const r=await request('student','/api/workspace/interviews','POST',{applicationId,title:'Personal preparation',at:new Date(Date.now()+86400000).toISOString(),duration:'30 minutes',venue:'Library'});assert.equal(r.status,201);assert.ok((await request('student','/api/workspace')).data.interviews.some(i=>i.id===r.data.id));assert.ok(!(await request('recruiter','/api/workspace')).data.interviews.some(i=>i.id===r.data.id));});
    await t.test('profile validates links and persists skills',async()=>{assert.equal((await request('student','/api/workspace/profile','PUT',{name:'Student',github:'javascript:alert(1)'})).status,400);assert.equal((await request('student','/api/workspace/profile','PUT',{name:'Student SAMPLE001',skills:'Angular, TypeScript, MySQL',headline:'Angular lab'})).status,200);assert.equal((await request('student','/api/workspace')).data.profiles[0].headline,'Angular lab');});
    await t.test('admin company create update delete',async()=>{const r=await request('admin','/api/companies','POST',{name:'Integration Company',position:'Angular developer',openings:2,workMode:'Remote',skills:'Angular, SQL',ctc:'9 LPA'});assert.equal(r.status,201);const id=r.data.id;assert.equal((await request('admin',`/api/companies/${id}`,'PUT',{name:'Updated Integration Company',position:'Angular developer',openings:3})).status,200);assert.equal((await request('admin',`/api/companies/${id}`,'DELETE')).status,200);});
    await t.test('active applications protect companies from deletion',async()=>assert.equal((await request('admin','/api/companies/1','DELETE')).status,409));
    await t.test('withdraw cascades interviews and permits reapplication',async()=>{assert.equal((await request('student',`/api/applications/${applicationId}`,'DELETE')).status,200);assert.ok(!(await request('student','/api/workspace')).data.interviews.some(i=>i.id===interviewId));assert.equal((await request('student','/api/applications','POST',{companyId:1})).status,201);});
    await t.test('notifications can be marked read',async()=>{assert.equal((await request('student','/api/workspace/notifications/read','PATCH',{})).status,200);assert.ok((await request('student','/api/workspace')).data.notices.every(n=>n.read));});
    await t.test('logout clears only Angular session cookie',async()=>{const r=await request('student','/api/auth/logout','POST',{});assert.match(r.cookie,/^cpms_angular_token=;/);});
  }finally{
    if(child&&child.exitCode===null){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}
    if(created){assert.match(name,/^cpms_angular_test_[0-9a-f]{12}$/);await db.query('DROP DATABASE ??',[name]);}
    assert.deepEqual(await hash(local.DB_NAME),angularBefore,'Angular classroom data preserved');assert.deepEqual(await hash(admin.DB_NAME||'cpms'),reactBefore,'React data preserved');await db.end();
  }
});
