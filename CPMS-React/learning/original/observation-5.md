# Experiment 5: Introduction to MySQL

These are the basic programs for the five syllabus questions. The separate database `fsd_lab5` is used for practice; the CPMS databases are not used.

## 5a: Create a database and table using MySQL Command Line Client

**Aim:** Create a database named fsd_lab5 and a students table.

**Program:** `5a.sql`.

**Run:** In PowerShell at the placement-dashboard root, run `mysql -u YOUR_MYSQL_USER -p`. At the mysql prompt, enter:

```sql
SOURCE src/Experiments5/5a.sql;
```

**Output:** SHOW TABLES displays students. DESCRIBE displays id, name, branch and cgpa.

## 5b: Create, insert and update table data

**Aim:** Create the students table, insert three records and update Priya's CGPA.

**Program:** `5b.sql`.

```sql
SOURCE src/Experiments5/5b.sql;
```

**Output:**

| id | name | branch | cgpa |
| --- | --- | --- | --- |
| 1 | Giri | CSE | 9.10 |
| 2 | Priya | CSE | 8.50 |
| 3 | Arun | ECE | 6.80 |

ON DUPLICATE KEY UPDATE lets you rerun the sample without duplicate-ID errors. It replaces only the three practice records in fsd_lab5.

## 5c: Subqueries

**Aim:** Use scalar, IN and correlated subqueries.

**Program:** `5c.sql`. Run 5b first.

```sql
SOURCE src/Experiments5/5c.sql;
```

**Output:** The first query returns Giri and Priya (overall average CGPA approximately 8.13). The second also returns Giri and Priya. The third returns only Giri (CSE average 8.80).

## 5d: MySQL Workbench script file

**Aim:** Create, save and execute a reusable SQL script in Workbench.

**Program:** `5d.sql`. Run 5b first.

Open Workbench and connect to your local MySQL server. Choose File > New Query Tab, enter the program, then File > Save Script As and save 5d.sql. Use File > Open SQL Script to reopen it. Execute with the lightning button.

**Output:** The students result grid contains three records. The branch summary contains CSE: 2 students, average 8.80; ECE: 1 student, average 6.80.

## 5e: Database directory and initialization SQL integrated into an API

**Aim:** Create a database directory with database.sql, initialize MySQL and read its data using an Express API and mysql2 driver.

**Program files:** `5e/database/database.sql`, `5e/db.js` and `5e/server.js`.

At the mysql prompt, from the repository root:

```sql
SOURCE src/Experiments5/5e/database/database.sql;
```

In PowerShell at the repository root:

```powershell
Copy-Item src/Experiments5/5e/.env.example src/Experiments5/5e/.env
# Edit that .env with your local MySQL user and password.
node src/Experiments5/5e/server.js
```

The existing project already includes Express, mysql2 and dotenv. Open `http://127.0.0.1:3001/` to see the connection message and database name, and `/students` to see the three records as JSON. Credentials are read on the server; they are not part of the browser code.

For your observation record, write each question, aim, the corresponding program file(s), observed output and result. Run the programs and record your own output screenshots.
