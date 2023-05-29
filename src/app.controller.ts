import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/select')
  async select(@Body() data) {
    return await this.appService.selectAll(data);
  }

  @Post('/insert')
  async insert(@Body() data) {
    return await this.appService.insertData(data);
  }
}
