from logging import FileHandler, StreamHandler, INFO, ERROR, Formatter, basicConfig, error as log_error, info as log_info
from os import path as ospath, environ
from subprocess import run as srun, PIPE
from dotenv import load_dotenv
from datetime import datetime
import pytz

# Define IST timezone
IST = pytz.timezone("Asia/Kolkata")

class ISTFormatter(Formatter):
    """Custom formatter to use IST timezone."""
    def formatTime(self, record, datefmt=None):
        dt = datetime.fromtimestamp(record.created, IST)
        return dt.strftime(datefmt or "%d-%b-%y %I:%M:%S %p")

# Clear log file if it exists
log_file = "log.txt"
if ospath.exists(log_file):
    with open(log_file, "w") as f:
        f.truncate(0)

# Create handlers
file_handler = FileHandler(log_file)
stream_handler = StreamHandler()

# Create custom formatter with IST timezone
formatter = ISTFormatter("[%(asctime)s] [%(levelname)s] - %(message)s", "%d-%b-%y %I:%M:%S %p")
file_handler.setFormatter(formatter)
stream_handler.setFormatter(formatter)

# Configure logging
basicConfig(handlers=[file_handler, stream_handler], level=INFO)

# Load environment variables
load_dotenv("config.env")
UPSTREAM_REPO = environ.get("UPSTREAM_REPO", "").strip() or None
UPSTREAM_BRANCH = environ.get("UPSTREAM_BRANCH", "").strip() or "main"

if UPSTREAM_REPO:
    git_dir = ".git"
    
    if ospath.exists(git_dir):
        srun(["rm", "-rf", git_dir])
        log_info("Removed existing .git directory.")
    else:
        log_info(".git directory not found, proceeding with initialization.")

    git_add_command = "git add --all" if ospath.exists(git_dir) else "git add --all -- ':!config.env'"

    git_commands = [
        "git init -q",
        "git config --global user.email 'doc.adhikari@gmail.com'",
        "git config --global user.name 'weebzone'",
        git_add_command,
        "git commit -sm 'update' -q",
    ]

    # Check if remote 'origin' already exists
    check_remote = srun("git remote", shell=True, stdout=PIPE, text=True)
    if "origin" not in check_remote.stdout:
        git_commands.append(f"git remote add origin {UPSTREAM_REPO}")

    git_commands.extend([
        "git fetch origin -q",
        f"git reset --hard origin/{UPSTREAM_BRANCH} -q"
    ])

    update = srun(" && ".join(git_commands), shell=True)

    repo_parts = UPSTREAM_REPO.rstrip("/").split("/")
    formatted_repo = f"https://github.com/{repo_parts[-2]}/{repo_parts[-1]}"

    if update.returncode == 0:
        log_info("Successfully updated with latest commits!!")
        log_info(f"UPSTREAM_REPO: {formatted_repo} | UPSTREAM_BRANCH: {UPSTREAM_BRANCH}")
    else:
        log_error("Something went wrong!!")
        log_error(f"UPSTREAM_REPO: {formatted_repo} | UPSTREAM_BRANCH: {UPSTREAM_BRANCH}")
        
