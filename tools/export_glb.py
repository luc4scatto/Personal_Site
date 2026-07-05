# Export hero GLB models from the Blender source file.
# Usage:
#   /Applications/Blender.app/Contents/MacOS/blender -b --factory-startup -noaudio \
#     _originals/3d_files.blend --python tools/export_glb.py
import bpy
import os

OUT = os.path.join(os.path.dirname(bpy.data.filepath), "..", "public", "models")
# per-mesh poly cap: only meshes above it get decimated, small parts stay intact
MESH_CAP = 8000
SINGLE_MESH_CAP = 20000  # single-mesh objects carry all their detail in one mesh
# per-file overrides (cdj: keeps the 35.5k jog wheel undecimated, it warps below that)
FILE_CAPS = {"cdj": 40000}

ROOT_OBJECTS = {
    "speaker": "speaker",
    "macbook": "macbook",
    "dj-mixer": "dj-mixer",
    "lego": "lego",
    "printer-3d": "printer-3d",
}
COLLECTIONS = {
    "Server": "server",
    "CDJ": "cdj",
    "Turntable": "turntable",
    "Lego_Figure": "lego-figure",
}


def export(objs, filename):
    bpy.ops.object.select_all(action="DESELECT")
    meshes = [o for o in objs if o.type == "MESH"]
    cap = FILE_CAPS.get(filename, SINGLE_MESH_CAP if len(meshes) == 1 else MESH_CAP)
    for o in objs:
        o.hide_set(False)
        o.hide_viewport = False
        o.hide_select = False
        # bevel/subsurf explode poly counts at export; invisible at icon size
        for m in list(o.modifiers):
            if m.type in ("BEVEL", "SUBSURF", "MULTIRES"):
                o.modifiers.remove(m)
        if o.type == "MESH" and len(o.data.polygons) > cap:
            mod = o.modifiers.new("auto_decimate", "DECIMATE")
            mod.ratio = cap / len(o.data.polygons)
        o.select_set(True)
    path = os.path.abspath(os.path.join(OUT, filename + ".glb"))
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="PLACEHOLDER",
        export_texcoords=False,
        export_draco_mesh_compression_enable=True,
    )
    print(f"EXPORTED {filename}.glb ({os.path.getsize(path)} bytes)")


for objname, filename in ROOT_OBJECTS.items():
    o = bpy.data.objects.get(objname)
    if o:
        export([o], filename)
    else:
        print(f"MISSING OBJECT: {objname}")

for collname, filename in COLLECTIONS.items():
    c = bpy.data.collections.get(collname)
    if c:
        export(list(c.objects), filename)
    else:
        print(f"MISSING COLLECTION: {collname}")

print("EXPORT DONE")
