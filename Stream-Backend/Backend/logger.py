from logging import getLogger, FileHandler, StreamHandler, INFO, ERROR, Formatter, basicConfig
import pytz
from datetime import datetime

# Define IST timezone
IST = pytz.timezone("Asia/Kolkata")

class ISTFormatter(Formatter):
    """Custom formatter to use IST timezone."""
    def formatTime(self, record, datefmt=None):
        dt = datetime.fromtimestamp(record.created, IST)
        return dt.strftime(datefmt or "%d-%b-%y %I:%M:%S %p")

# Create handlers
file_handler = FileHandler("log.txt")
stream_handler = StreamHandler()

# Create formatter with IST timezone
formatter = ISTFormatter("[%(asctime)s] [%(levelname)s] - %(message)s", "%d-%b-%y %I:%M:%S %p")

# Set formatter to handlers
file_handler.setFormatter(formatter)
stream_handler.setFormatter(formatter)

# Configure basic logging
basicConfig(
    handlers=[file_handler, stream_handler],
    level=INFO
)

# Set log level for external libraries
getLogger("aiohttp").setLevel(ERROR)
getLogger("pyrogram").setLevel(ERROR)
getLogger("fastapi").setLevel(ERROR)

# Create main logger
LOGGER = getLogger(__name__)
LOGGER.setLevel(INFO)

# Example log message
LOGGER.info("Logger initialized with IST timezone.")
