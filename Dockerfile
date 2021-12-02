# nodejs image
FROM node:14-alpine

# working directory
WORKDIR /app

# copy project files
COPY . .

# install dependencies
RUN npm install

# build app
RUN npm run build

# export port
EXPOSE 8788

# run app
CMD ["node", "serve.js"]
