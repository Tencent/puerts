const fs = require('fs');

const nativeBlobPerfix = "#pragma once\n\n#include <cstdint>\n\nstatic const uint8_t NativesBlobCode[] = {\n";

const snapshotBlobPerfix = "#pragma once\n\n#include <cstdint>\n\nstatic const uint8_t SnapshotBlobCode[] = {\n";

var platform = process.argv[2];

var blobPath = process.argv[3];

var output = process.argv[4] || "./";

var context = "//" + platform + "\n";

context += blobPath.includes("snapshot_blob.bin") ? snapshotBlobPerfix : nativeBlobPerfix;

output += blobPath.includes("snapshot_blob.bin") ? "SnapshotBlob.h" : "NativesBlob.h";

var binary = fs.readFileSync(blobPath);

var buff = Buffer.from(binary, 'binary');

const kLineSize = 15;

for(var i = 0; i < buff.length; ++i) {
    context += "0x" + buff.slice(i, i+1).toString('hex') + ", ";
    if ( (i + 1) % kLineSize == 0) {
        context += "\n";
    }
}

context += "};\n";

fs.writeFileSync(output, context, 'utf8');
