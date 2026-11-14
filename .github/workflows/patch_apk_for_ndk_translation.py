#!/usr/bin/env python3
"""
CI only: make an arm64 Unity apk runnable on the x86_64 emulator's ARM translation (libndk_translation).

libndk_translation 0.2.x does not implement some AArch64 hint instructions used by libunity.so
spin-wait loops (SEVL / WFE) and raises SIGILL ("Undefined instruction 0xd50320bf").
Architecturally both are hints: WFE may wake up spuriously at any time and SEVL only primes the
first WFE, so replacing them with NOP keeps the code correct (the wait loop just spins).

The script patches every 4-byte aligned occurrence inside executable PT_LOAD segments of the
given .so files in the apk, and writes an unsigned apk (signing block / v1 signature dropped).
Run zipalign + apksigner on the output afterwards.

usage: patch_apk_for_ndk_translation.py in.apk out.apk [lib/arm64-v8a/libunity.so ...]
"""
import struct
import sys
import zipfile

NOP = 0xD503201F
PATCHES = {
    0xD50320BF: "sevl",
    0xD503205F: "wfe",
}
PF_X = 1
PT_LOAD = 1


def exec_ranges(data):
    if data[:4] != b"\x7fELF" or data[4] != 2 or data[5] != 1:
        raise ValueError("not a little-endian ELF64 file")
    e_phoff, = struct.unpack_from("<Q", data, 0x20)
    e_phentsize, e_phnum = struct.unpack_from("<HH", data, 0x36)
    for i in range(e_phnum):
        off = e_phoff + i * e_phentsize
        p_type, p_flags, p_offset, _vaddr, _paddr, p_filesz = struct.unpack_from("<IIQQQQ", data, off)
        if p_type == PT_LOAD and p_flags & PF_X:
            yield p_offset, p_offset + p_filesz


def patch_so(data):
    buf = bytearray(data)
    counts = {name: 0 for name in PATCHES.values()}
    nop = struct.pack("<I", NOP)
    for start, end in exec_ranges(buf):
        pos = (start + 3) & ~3
        while pos + 4 <= end:
            word, = struct.unpack_from("<I", buf, pos)
            name = PATCHES.get(word)
            if name:
                buf[pos:pos + 4] = nop
                counts[name] += 1
            pos += 4
    return bytes(buf), counts


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    src, dst = sys.argv[1], sys.argv[2]
    targets = set(sys.argv[3:]) or {"lib/arm64-v8a/libunity.so"}
    found = set()
    with zipfile.ZipFile(src) as zin, zipfile.ZipFile(dst, "w") as zout:
        for info in zin.infolist():
            name = info.filename
            # old v1 signature would no longer match, apksigner re-signs the apk
            if name.startswith("META-INF/") and name.rsplit(".", 1)[-1].upper() in ("SF", "RSA", "DSA", "EC", "MF"):
                continue
            data = zin.read(info)
            if name in targets:
                data, counts = patch_so(data)
                found.add(name)
                print("patched %s: %s" % (name, ", ".join("%s x%d" % kv for kv in counts.items())))
            out = zipfile.ZipInfo(name, date_time=info.date_time)
            out.compress_type = info.compress_type
            out.external_attr = info.external_attr
            out.create_system = info.create_system
            zout.writestr(out, data)
    missing = targets - found
    if missing:
        print("ERROR: not found in apk: %s" % ", ".join(sorted(missing)))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
