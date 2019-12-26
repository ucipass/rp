import * as path from 'path';
let production = process.env.NODE_ENV == "production"

export const DEV_URL = process.env.DEV_URL
export const PREFIX = process.env.VUE_APP_PREFIX ? process.env.VUE_APP_PREFIX : ""
console.log(PREFIX,PREFIX,PREFIX)
let PREFIX_SCHEMA = path.join("/", PREFIX, "schema")
let PREFIX_CREATE = path.join("/", PREFIX, "create")
let PREFIX_READ =   path.join("/", PREFIX, "read")
let PREFIX_UPDATE = path.join("/", PREFIX, "update")
let PREFIX_DELETE = path.join("/", PREFIX, "delete")

export const URL_SCHEMA = production ? PREFIX_SCHEMA : DEV_URL + PREFIX_SCHEMA;
export const URL_CREATE = production ? PREFIX_CREATE : DEV_URL + PREFIX_CREATE;
export const URL_READ   = production ? PREFIX_READ   : DEV_URL + PREFIX_READ;
export const URL_UPDATE = production ? PREFIX_UPDATE : DEV_URL + PREFIX_UPDATE;
export const URL_DELETE = production ? PREFIX_DELETE : DEV_URL + PREFIX_DELETE;
