import { createDecipheriv } from "crypto";
import { createReadStream, createWriteStream, readFileSync, writeFileSync } from "fs";
import { pipeline } from "stream";
import { createUnzip } from "zlib";

const encryptedContent = readFileSync("secret.enc");
const algorithm = "aes-256-gcm";
const key = readFileSync("secret.key", "utf-8").substring(0, 32);
const iv = readFileSync("iv.txt");
const authTag = readFileSync("auth.txt");

const decipher = createDecipheriv(algorithm, key, iv);
decipher.setAuthTag(authTag);

const output = Buffer.concat([decipher.update(encryptedContent), decipher.final()]);
writeFileSync("decrypted.zip", output);

const unzip = createUnzip();
const inputStream = createReadStream("decrypted.zip");
const outputStream = createWriteStream("decrypted");
pipeline(inputStream, unzip, outputStream, (error) => {
    if (error) console.error(error);
});