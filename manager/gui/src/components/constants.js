import * as path from 'path';
export const DEV_URL = process.env.DEV_URL ? process.env.DEV_URL : "http://localhost:8080"
export const PREFIX = process.env.VUE_APP_PREFIX ? process.env.VUE_APP_PREFIX : ""
let PREFIX_LOGIN = "login"
let PREFIX_LOGOUT = "logout"
let PREFIX_SCHEMA = "schema"
let PREFIX_STATUS = "status"
let PREFIX_DOWNLOAD = "download"
let PREFIX_CREATE = "create"
let PREFIX_READ   = "read"
let PREFIX_UPDATE = "update"
let PREFIX_DELETE = "delete"  
let PREFIX_SIOCLIENTS_CREATE   = "sioclients/create"
let PREFIX_SIOCLIENTS_READ   = "sioclients/read"
let PREFIX_SIOCLIENTS_UPDATE   = "sioclients/update"
let PREFIX_SIOCLIENTS_DELETE   = "sioclients/delete"

if (process.env.NODE_ENV != "production"){
    PREFIX_LOGIN = DEV_URL + path.join("/", PREFIX, "login")
    PREFIX_LOGOUT = DEV_URL + path.join("/", PREFIX, "logout")
    PREFIX_SCHEMA = DEV_URL + path.join("/", PREFIX, "schema")
    PREFIX_STATUS = DEV_URL + path.join("/", PREFIX, "status")
    PREFIX_DOWNLOAD = DEV_URL + path.join("/", PREFIX, "download")
    PREFIX_CREATE = DEV_URL + path.join("/", PREFIX, "create")
    PREFIX_READ   = DEV_URL + path.join("/", PREFIX, "read")
    PREFIX_UPDATE = DEV_URL + path.join("/", PREFIX, "update")
    PREFIX_DELETE = DEV_URL + path.join("/", PREFIX, "delete")   
    PREFIX_SIOCLIENTS_CREATE = DEV_URL + path.join("/", PREFIX, "sioclients", "create")
    PREFIX_SIOCLIENTS_READ   = DEV_URL + path.join("/", PREFIX, "sioclients", "read")
    PREFIX_SIOCLIENTS_UPDATE = DEV_URL + path.join("/", PREFIX, "sioclients", "update")
    PREFIX_SIOCLIENTS_DELETE = DEV_URL + path.join("/", PREFIX, "sioclients", "delete")
}

console.log( PREFIX == "" ? "Prefix: /" : `Prefix: /${PREFIX}`)

export const URL_LOGIN    = PREFIX_LOGIN;
export const URL_LOGOUT   = PREFIX_LOGOUT;
export const URL_SCHEMA   = PREFIX_SCHEMA;
export const URL_STATUS   = PREFIX_STATUS;
export const URL_DOWNLOAD = PREFIX_DOWNLOAD;
export const URL_CREATE   = PREFIX_CREATE;
export const URL_READ     = PREFIX_READ;
export const URL_UPDATE   = PREFIX_UPDATE;
export const URL_DELETE   = PREFIX_DELETE;
export const URL_SIOCLIENTS_CREATE = PREFIX_SIOCLIENTS_CREATE;
export const URL_SIOCLIENTS_READ = PREFIX_SIOCLIENTS_READ;
export const URL_SIOCLIENTS_UPDATE = PREFIX_SIOCLIENTS_UPDATE;
export const URL_SIOCLIENTS_DELETE = PREFIX_SIOCLIENTS_DELETE;
