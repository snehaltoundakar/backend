/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { databaseConfig } from './db.config';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  /******Execute Query*************/
  async executeQuery(query: string, parameters?: any): Promise<any> {
    try {
      await databaseConfig.connect();
      const request = databaseConfig.request();
      if (parameters) {
        for (const [key, value] of Object.entries(parameters)) {
          request.input(key, value);
        }
      }
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      databaseConfig.close();
    }
  }

  //----------------------------- Insert Data Into Table As Received Data -----------------------//
  async insertData(data) {
    console.log(data);
    const dataset = await this.createObjectInsert(data);
    const fieldNames = dataset.field.join(', ');
    const values = dataset.value.join(', ');
    const query = `INSERT INTO ${dataset.table} (${fieldNames}) VALUES (${values})`;
    console.log(query);
    return this.executeQuery(query);

  }
  //----------------------------- End Function Insert Data -----------------------------------//

  //----------------------------- Create a Object For Insert Data ---------------------------//
  async createObjectInsert(data) {
    const returnObj: any = {};
    const fieldArray = [];
    const valueArray = [];
    const datatype = [];

    returnObj['table'] = data.table;
    const query = `select column_name,data_type from information_schema.columns where table_name = '${data.table}';`;
    const result: any = await this.executeQuery(query, []);
    for (const item of result) {
      datatype.push(JSON.parse(JSON.stringify(item)));
    }
    console.log(datatype);
    Object.keys(data.data).forEach((ele: any) => {
      if (
        data.data[ele] != '' &&
        data.data[ele] != null &&
        data.data[ele] != undefined
      ) {
        const filterObj = datatype.filter((eles) => eles.column_name == ele);
        console.log(filterObj);
        if (filterObj.length != 0) {
          if (filterObj[0].data_type == 'nvarchar' ||filterObj[0].data_type == 'varchar' && typeof data.data[ele]=="string") {
            fieldArray.push(ele);
            valueArray.push(`'${data.data[ele]}'`);
            console.log(typeof data.data[ele], "accepeted val=",data.data[ele]); 

          } else if (filterObj[0].data_type == 'int' || filterObj[0].data_type == 'numeric' || filterObj[0].data_type == 'nchar' && typeof data.data[ele]=="number") {
            fieldArray.push(ele);
            valueArray.push(Number(data.data[ele]));
            console.log(typeof data.data[ele], "accepeted val=",data.data[ele]); 
          }
          else if(filterObj[0].data_type == 'bit'){
              fieldArray.push(ele);
              console.log(typeof data.data[ele], "accepeted val=",data.data[ele]); 
              valueArray.push(data.data[ele] ? '1' : '0');          
            
           }
           else if(filterObj[0].data_type == 'date'){
            fieldArray.push(ele);
            console.log(typeof data.data[ele], "accepeted val=",data.data[ele]); 
              valueArray.push(`'${data.data[ele]}'`);                     
           }
        }
      }
    });

    returnObj['field'] = fieldArray;
    returnObj['value'] = valueArray;
    return returnObj;
  }

  //----------------------------* Selected Data Return As Per Requirement *------------------------//
  async selectAll(data) {
    console.log(data);

    //--------------------------------* Start Select Query Creation *------------------------///
    let query = `SELECT `;
    if (data.hasOwnProperty('view')) {
      if (data?.view?.length != 0) {
        for (const [i, value] of data.view.entries()) {
          if (i === data.view.length - 1) {
            query += ` ${value}`;
          } else {
            query += ` ${value},`;
          }
        }
      } else {
        query += '*';
      }
    } else {
      query += '*';
    }

    query += ` FROM ${data.table}`;

    // --------------------------------* Join Condition Part *-------------------------------////
    if (data.hasOwnProperty('join')) {
      for (const item of data.join) {
        for (const [key, value] of Object.entries(item)) {
          query += ` ${key} ${value[0].table} on ${value[0].table}.${value[0].relationColumn} = ${data.table}.${value[0].mainColumn}`;
        }
      }
    }
    //--------------------------------* End Join Condition Part *---------------------------////
    //--------------------------------* Start Where Condition Part *-------------------------///
    if (data.hasOwnProperty('condition')) {
      if (data?.condition.length != 0) {
        query += ` where`;
        for (const item of data.condition) {
          console.log(item);
          if (item?.type == 'BETWEEN') {
            query += `${item.condition} ${item.column} BETWEEN `;
            for (const [i, value] of item.value.entries()) {
              if (i === item.value.length - 1) {
                query += ` AND ${value}`;
              } else {
                query += ` ${value}`;
              }
            }
          } else {
            for (const [key, value] of Object.entries(item)) {
              if (key != 'type') {
                query += ` ${key} = ${value}`;
              } else {
                query += ` ${value}`;
              }
            }
          }
        }
      }
    }
    ///-------------------------------* End Where Condition Part *------------------------//////////
    ///--------------------------------* Start Sort Condtion Part *------------------------/////////

    if (data.hasOwnProperty('sort')) {
      if (data.sort[0].column.length != 0) {
        query += ' order by ';
        for (const [i, value] of data.sort[0].column.entries()) {
          if (i === data.sort[0].column.length - 1) {
            query += ` ${value}`;
          } else {
            query += ` ${value},`;
          }
        }

        query += ` ${data.sort[0].order}`;
      }
    }
    /////--------------------------------* End Sort Condition Part *---------------///////////////
    ///----------------------------------* Limit Condtion Part *------------------/////////////////
    // if(data.hasOwnproperty('limit')){
    //   query += ' limit '+ data.limit;
    // }
    ///////------------------------------* End Limit Condtion Part *---------------////////////////////

    console.log(query);
    return this.executeQuery(query, []);
  }
}
