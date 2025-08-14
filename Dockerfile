FROM denoland/deno:alpine

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Optional: expose the port your app listens on
EXPOSE 4001

# Run your Deno server (adjust if your entry file is different)
CMD ["task", "start"]
