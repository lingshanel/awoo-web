import { Controller, Get, Param, Query } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardThreadsQueryDto } from './dto/board-threads-query.dto';
import { RecentThreadsQueryDto } from './dto/recent-threads-query.dto';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  getBoards() {
    return this.boardsService.getBoards();
  }

  @Get('recent/threads')
  getRecentThreads(@Query() query: RecentThreadsQueryDto) {
    return this.boardsService.getRecentThreads(query);
  }

  @Get(':slug')
  getBoard(@Param('slug') slug: string) {
    return this.boardsService.getBoard(slug);
  }

  @Get(':slug/threads')
  getBoardThreads(
    @Param('slug') slug: string,
    @Query() query: BoardThreadsQueryDto,
  ) {
    return this.boardsService.getBoardThreads(slug, query);
  }
}
