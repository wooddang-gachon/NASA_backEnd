import os
import glob
import re

# 1. src/interfaces/user.ts
f_user = "src/interfaces/user.ts"
if os.path.exists(f_user):
    with open(f_user, "r") as f: content = f.read()
    content = content.replace("from '../models/User';", "from '../repositories/models/User';")
    with open(f_user, "w") as f: f.write(content)

# 2. src/repositories/models/*.ts
for f_path in glob.glob("src/repositories/models/*.ts"):
    with open(f_path, "r") as f: content = f.read()
    content = content.replace("../interfaces/enums", "../../interfaces/enums")
    with open(f_path, "w") as f: f.write(content)

# 3. src/tests/**/*.ts
for root, _, files in os.walk("src/tests"):
    for file in files:
        if file.endswith(".ts"):
            f_path = os.path.join(root, file)
            with open(f_path, "r") as f: content = f.read()
            # If in src/tests/ (depth 0 from tests)
            if root == "src/tests":
                content = content.replace("../src/", "../")
            # If in src/tests/experimental/ (depth 1)
            elif root.startswith("src/tests/"):
                # roughly replacing ../../src/ with ../../
                content = content.replace("../../src/", "../../")
                content = content.replace("../src/", "../")
            
            with open(f_path, "w") as f: f.write(content)

# 4. src/mappers/travelMapper.ts
f_map = "src/mappers/travelMapper.ts"
if os.path.exists(f_map):
    with open(f_map, "r") as f: content = f.read()
    content = content.replace("travelResult: travelResultData,", "travelResult: travelResultData as any,")
    with open(f_map, "w") as f: f.write(content)

