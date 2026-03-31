---
name: add-class-pack
description: Scaffold a new YOLO class pack into the class-pack registry
---

You are adding a new class pack to the openlabel class-pack registry.

**Steps:**

1. Read `/common/domain/classes/` to understand the existing registry structure and how COCO-80 is defined.
2. Read AGENTS.md section 5 for `ClassDef` type.
3. Ask for the pack name and class list if not provided in $ARGUMENTS. Format: `<pack-name> [class1, class2, ...]`.
4. Create the pack file at `/common/domain/classes/packs/<pack-name>.ts`.
   - Export a `const <packName>Classes: ClassDef[]` array with zero-indexed IDs, canonical names, and default hex colors.
   - Colors should be visually distinct and accessible; do not reuse COCO-80 colors unless the class is shared.
5. Register the pack in `/common/domain/classes/registry.ts` — add it to the `CLASS_PACK_REGISTRY` map.
6. Write a unit test at `/tests/unit/domain/classes/<pack-name>.test.ts`:
   - IDs are zero-indexed and contiguous.
   - No duplicate names within the pack.
   - All colors are valid 6-digit hex.
   - Pack is present in the registry.
7. Run `make typecheck` and `make test` and fix any failures before stopping.

**Hard rules:**
- Never mutate IDs after a pack ships — add new classes at the end.
- Source must be `"preset"`.
- Do not add `Co-Authored-By` to the commit.
