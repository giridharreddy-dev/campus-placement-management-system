import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {randomBytes, createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require = createRequire(new URL('../package.json', import.meta.url));
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const root = new URL('../', import.meta.url);
const database = 'cpms_angular_sample';
const envFile = new URL('.env', root);
if (existsSync(envFile)) throw new Error('Angular .env already exists. Refusing to replace configuration or reinitialize data.');
const candidates = [new URL('../CPMS-React/.env', root), new URL('../../.env', root)];
let config = process.env.MYSQL_SETUP_USER ? {DB_HOST:process.env.MYSQL_SETUP_HOST||'127.0.0.1',DB_PORT:process.env.MYSQL_SETUP_PORT||'3306',DB_USER:process.env.MYSQL_SETUP_USER,DB_PASSWORD:process.env.MYSQL_SETUP_PASSWORD||'',DB_NAME:process.env.REACT_DB_NAME} : undefined;
for (const file of candidates) {
  if (!config && existsSync(file)) {config = dotenv.parse(await fs.readFile(file)); break;}
}
if (!config) throw new Error('No local database administrator configuration found. Set up MySQL using README.md.');
const db = await mysql.createConnection({host:config.DB_HOST||'127.0.0.1',port:Number(config.DB_PORT||3306),user:config.DB_USER,password:config.DB_PASSWORD||'',multipleStatements:true});
const audit = {};
async function coreHashes() {
  const result = {};
  if (!config.DB_NAME) return result;
  for (const name of ['students','companies','applications','users']) {
    const [rows]=await db.query('SELECT * FROM ??.?? ORDER BY id',[config.DB_NAME||'cpms',name]);
    result[name]=createHash('sha256').update(JSON.stringify(rows)).digest('hex');
  }
  return result;
}
try {
  audit.before = await coreHashes();
  const [present]=await db.execute('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME=?',[database]);
  if (present.length) throw new Error('Angular database already exists. Refusing to overwrite any data.');
  await db.query('CREATE DATABASE ?? CHARACTER SET utf8mb4', [database]);
  await db.query('USE ??',[database]);
  const schema=(await fs.readFile(new URL('database/schema.sql',root),'utf8')).split('INSERT IGNORE')[0].replace('CREATE DATABASE IF NOT EXISTS cpms;','').replace('USE cpms;','').replaceAll('React','Angular');
  await db.query(schema);
  await db.query(await fs.readFile(new URL('database/workspace.sql',root),'utf8'));
  for (const student of [
    ['SAMPLE001','Student SAMPLE001','student@cpms.local',8.2,'Computer Science','Angular, TypeScript, Node.js, MySQL'],
    ['SAMPLE002','Priya Rao','priya@cpms.local',8.8,'Computer Science','Python, SQL, Angular'],
    ['SAMPLE003','Arun Kumar','arun@cpms.local',7.9,'Electronics','Java, Linux, Docker'],
    ['SAMPLE004','Sneha Reddy','sneha@cpms.local',9.1,'Information Technology','TypeScript, Angular, SQL']
  ]) await db.execute('INSERT INTO students (id,name,email,cgpa,branch,skills) VALUES (?,?,?,?,?,?)',student);
  const companies=[
    ['TechCorp','Software Engineer','Bangalore','10.5 LPA',8,'Hybrid',['Angular','Java','SQL']],
    ['DataSystems','Data Analyst','Pune','8.0 LPA',5,'On-site',['Python','SQL','Analytics']],
    ['CloudTech','Full Stack Developer','Hyderabad','12.0 LPA',12,'Hybrid',['Angular','Node.js','MySQL']],
    ['InnovateSoft','DevOps Engineer','Chennai','9.5 LPA',4,'On-site',['Linux','Docker','Cloud']],
    ['PixelWorks','Frontend Developer','Remote','7.5 LPA',6,'Remote',['TypeScript','Angular','CSS']],
    ['Orbit Labs','Product Engineering Intern','Bangalore','35k / month',10,'Hybrid',['Problem solving','Git','APIs']]
  ];
  for (const [name,position,location,ctc,openings,mode,tags] of companies) {
    const [saved]=await db.execute('INSERT INTO companies (name,position,location,ctc,salary,openings) VALUES (?,?,?,?,?,?)',[name,position,location,ctc,ctc,openings]);
    const deadline = new Date(Date.now()+(10+saved.insertId)*86400000).toISOString().slice(0,10);
    await db.execute('INSERT INTO company_details (company_id,work_mode,deadline,tags,description) VALUES (?,?,?,?,?)',[saved.insertId,mode,deadline,JSON.stringify(tags),`Join the ${position.toLowerCase()} team at ${name}. Build practical skills through product work and mentoring. Selection includes an online assessment, a technical discussion and an HR interview.`]);
  }
  const passwordHash=await bcrypt.hash('CpmsDemo@2026',12);
  const accounts=[['student@cpms.local','STUDENT','SAMPLE001',null],['recruiter@cpms.local','RECRUITER',null,1],['admin@cpms.local','ADMIN',null,null],['priya@cpms.local','STUDENT','SAMPLE002',null],['recruiter2@cpms.local','RECRUITER',null,2]];
  for (const [email,role,studentId,companyId] of accounts) await db.execute('INSERT INTO users (email,password_hash,role,student_id,company_id) VALUES (?,?,?,?,?)',[email,passwordHash,role,studentId,companyId]);
  for (const application of [['SAMPLE001',3,'Interview'],['SAMPLE002',1,'Applied'],['SAMPLE003',1,'Shortlisted'],['SAMPLE004',3,'Offered'],['SAMPLE002',2,'Selected']]) await db.execute('INSERT INTO applications (student_id,company_id,status) VALUES (?,?,?)',application);
  await db.execute('INSERT INTO career_profiles (student_id,headline) VALUES (?,?)',['SAMPLE001','Computer Science student | Full stack development']);
  const scheduled=new Date(Date.now()+3*86400000).toISOString().slice(0,19).replace('T',' ');
  await db.execute("INSERT INTO interviews (application_id,created_by,kind,title,scheduled_at,venue,duration) VALUES (1,3,'official','Technical discussion',?,'Placement cell · Room 204','45 minutes')",[scheduled]);
  for (const userId of [1,2,3]) await db.execute('INSERT INTO workspace_notifications (user_id,title,detail) VALUES (?,?,?)',[userId,'Welcome to CPMS Angular','Your separate Angular and Node.js classroom workspace is ready.']);
  const dbUser='cpms_angular_'+randomBytes(3).toString('hex');
  const dbPassword=randomBytes(24).toString('hex');
  await db.query('CREATE USER ?@? IDENTIFIED BY ?',[dbUser,'localhost',dbPassword]);
  await db.query('GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, REFERENCES ON ??.* TO ?@?',[database,dbUser,'localhost']);
  const env=[`DB_HOST=${config.DB_HOST||'127.0.0.1'}`,`DB_PORT=${config.DB_PORT||3306}`,`DB_USER=${dbUser}`,`DB_PASSWORD=${dbPassword}`,`DB_NAME=${database}`,`JWT_SECRET=${randomBytes(48).toString('hex')}`,'PORT=5100',''].join('\n');
  await fs.writeFile(envFile,env,{flag:'wx'});
  audit.after=await coreHashes();
  audit.existingReactDatabaseUnchanged=JSON.stringify(audit.before)===JSON.stringify(audit.after);
  if (!audit.existingReactDatabaseUnchanged) throw new Error('React database changed during setup; inspect verification evidence.');
  await fs.mkdir(new URL('.verification/',root),{recursive:true});
  await fs.writeFile(new URL('.verification/setup.json',root),JSON.stringify(audit,null,2));
  console.log(`Created ${database} with a scoped database account. Existing React core tables are unchanged.`);
  console.log('Classroom logins: student@cpms.local, recruiter@cpms.local, admin@cpms.local. Password: CpmsDemo@2026');
} finally { await db.end(); }
