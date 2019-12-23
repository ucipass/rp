import * as path from 'path';
// import * as url from 'url'
let production = process.env.NODE_ENV == "production"
export const URL = production? "http://localhost:3000" : "http://localhost:1337";
export const PREFIX = process.env.VUE_APP_PREFIX ? process.env.VUE_APP_PREFIX : ""
export const PREFIX_SCHEMA = path.join("/", PREFIX, "schema")
export const PREFIX_CREATE = path.join("/", PREFIX, "create")
export const PREFIX_READ =   path.join("/", PREFIX, "read")
export const PREFIX_UPDATE = path.join("/", PREFIX, "update")
export const PREFIX_DELETE = path.join("/", PREFIX, "delete")
export const URL_SCHEMA = production ? PREFIX_SCHEMA : "http://localhost:1337"+PREFIX_SCHEMA;
export const URL_CREATE = production ? PREFIX_CREATE : "http://localhost:1337"+PREFIX_CREATE;
export const URL_READ = production ? PREFIX_READ : "http://localhost:1337"+PREFIX_READ;
export const URL_UPDATE = production ? PREFIX_UPDATE : "http://localhost:1337"+PREFIX_UPDATE;
export const URL_DELETE = production ? PREFIX_DELETE : "http://localhost:1337"+PREFIX_DELETE;
