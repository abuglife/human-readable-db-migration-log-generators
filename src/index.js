const { program } = require("commander");
const fg = require("fast-glob");
const fs = require("fs");

const start = () => {
  program
  .option("-p, --path <path>")
  .option("-s, --start <start>")
  .option("-orm, --orm <orm>");

  program.parse();

  const options = program.opts();
  const path = options.path ? options.path : "./";
  const startId = options.start ? options.start : "";
  const orm = options.orm? options.orm : "typeorm";

  startReadMigration(path, startId, orm);
};

const startReadMigration = async (path, startId, orm) => {
  const files = await fg([path + "/**"], { dot: true });

  const migrations = files.filter((file) => {
    const shortName = file.replace(path + "/", "") || "";
    const migrationId = shortName.split("-")[0];

    if (migrationId >= startId) {
      return true;
    }
    return false;
  });

  if (migrations?.length > 0) {
    extractMigrationData(migrations, orm);
  } else {
    console.log("No migrations found");
  }
};

const extractMigrationData = async (files, orm) => {
  const contents = await readAllFiles(files);
  const upMigrations = contents.map((content) => getUpMigration(content));
  
  console.log(upMigrations)

};

const readAllFiles = (files) => {
  return Promise.all(
    files.map((file) => {
      return fs.readFileSync(file, "utf8");
    })
  );
};

const getUpMigration = (content = "") => {
  const migrations = [];

  const removeNewLine = content.replaceAll("\n", "").replace(/\s\s+/g, ' ');

  const rx = /(public async up)(.*)(public async down)/g;
  const arr = rx.exec(removeNewLine);

  const migrateStr = arr[0] || ""
  const qrx = /(await queryRunner.query\()(.*)\)\;/g;
  const migrateArr = qrx.exec(migrateStr);

  const migrationStrs = (migrateArr[0] || "").split("await queryRunner.query(")
  migrationStrs.map((str) => {
    const mStr = str.trim().replace("`", "")
    migrations.push(mStr.replace("`, );", ""))
  })
  return migrations.filter((migration) => migration !== "").map(m => m.trim());
};

start();
