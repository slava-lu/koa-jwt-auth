# Авторизация по JWT для http и websockets


### Использование:

1. Создаем пользователя по POST запросу на http://localhost:3000/user. Передаем в теле объект вида
```
{
	"displayName": "Slava",
	"email": "slava@mail.ru",
	"password": "111111"
}
```

2. Авторизуемся и получаем токен в ответе по запросу POST на http://localhost:3000/login. Передаем в теле объект вида

```
{
	"email": "slava@mail.ru",
	"password": "111111"
}
```

3. Проверяем авторизации по токену по запросу GET на http://localhost:3000/login. 
Токен необходимо скопировать из ответа п2 и добавить в Header с ключем Authorization

4. Поверяем websocket авторизацию по токену через броузер http://localhost:3000. Токен необходимо скопировать из ответа п2 и добавить переменную jwt в файле public/socketEmitter