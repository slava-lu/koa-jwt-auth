# JWT Authentication for http and WebSockets for Node.js

### How to use:

+ Do not forget to start **mongod** on the local PC before launching the node server

+ To send http request you may use [Postman](https://www.getpostman.com/)

+ To create a new user make a POST request to http://localhost:3000/user with the body:
```
{
	"displayName": "Slava",
	"email": "slava@mail.ru",
	"password": "111111"
}
```

+ Sign in and get a JWT by sending POST request to http://localhost:3000/login with the body:

```
{
	"email": "slava@mail.ru",
	"password": "111111"
}
```

+ Check authentication via JWT by sending GET request to http://localhost:3000/custom
You need to copy JWT from the response of the previous request and copy it to the Header with the Authorization key
![рисунок](/images/Auth_header.png)

+ Check websocket JWT auth by launching the browser and going to http://localhost:3000. Before it you need to copy JWT in jwt variable in public/socketEmitter file

