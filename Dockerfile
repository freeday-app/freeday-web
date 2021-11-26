# nodejs image
FROM node:14-alpine

# working directory
WORKDIR /app

# copy project files
COPY . .

# install dependencies
RUN npm install

# export port
EXPOSE 8788

# run app
CMD ["npm", "start"]
