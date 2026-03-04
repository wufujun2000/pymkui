# 介绍

这是zlmediakit的前端项目，采用前后端分离架构，前端负责用户界面和交互，后端负责业务逻辑和数据处理。

# 前端项目规范
- 不同的html页面采用不同的html文件，例如：index.html, login.html等。
- 每个html页面都有一个对应的js文件，例如：index.js, login.js等。
- 每个js文件都有一个对应的html文件，例如：index.html, login.html等。

# restful api接口规范

接口支持GET/POST方式，参数支持urlencoded，也支持multi-part form-data格式，也支持json格式；返回值采用json格式。HTTP层面统一返回200状态码，body统一为json格式。
返回body中包含code、msg、data三个字段，code为状态码，msg为状态描述，data为返回数据。

- 参考如下：

```json
{
    "code": 0,
    "msg": "success",
    "data": {}
}
```

- code值代表执行结果，目前包含以下类型：

```c++
typedef enum {
    Exception = -400,//代码抛异常
    InvalidArgs = -300,//参数不合法
    SqlFailed = -200,//sql执行失败
    AuthFailed = -100,//鉴权失败
    OtherFailed = -1,//业务代码执行失败，
    Success = 0//执行成功
} ApiErr;
```

- 如果执行成功，那么code == 0,并且一般无msg字段。如果有数据返回，一般提供data字段返回数据。
- 开发者一般只要关注code字段和msg字段，如果code != 0时，打印显示msg字段即可。
- 如果code == -100, 则鉴权失败，要求重新登录，其返回body格式如下：

```json
{
    "code": -100,
    "msg": "Please login first",
    "cookie": "xxxxxxxx"
}
```

- 要求重新登录后请跳转登录页面，登录页面要求用户输入secret字段，点击登录后调用 `/index/api/login`接口登陆。

# 各个api接口定义

- http api postman接口定义请参考：https://raw.githubusercontent.com/ZLMediaKit/ZLMediaKit/refs/heads/master/postman/ZLMediaKit.postman_collection.json