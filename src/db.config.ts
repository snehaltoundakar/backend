/* eslint-disable prettier/prettier */
import { ConnectionPool } from 'mssql';

export const databaseConfig: ConnectionPool = new ConnectionPool({
  user: 'sa',
  password: 'rutuja',
  server: 'localhost',
  port: 5171,
  database: 'test',
  synchronize: true,
  logging:true,
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate:true
  },
});
