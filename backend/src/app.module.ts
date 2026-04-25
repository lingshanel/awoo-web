import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './modules/admin/admin.module';
import { BoardsModule } from './modules/boards/boards.module';
import { HealthModule } from './modules/health/health.module';
import { PostsModule } from './modules/posts/posts.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ThreadsModule } from './modules/threads/threads.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { SecurityModule } from './common/security/security.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    SecurityModule,
    HealthModule,
    BoardsModule,
    ThreadsModule,
    PostsModule,
    UploadsModule,
    ReportsModule,
    ReactionsModule,
    AdminModule,
  ],
})
export class AppModule {}
