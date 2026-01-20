import { Test, TestingModule } from '@nestjs/testing';
import { DonacionesService } from './donaciones.service';

describe('DonacionesService', () => {
  let service: DonacionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DonacionesService],
    }).compile();

    service = module.get<DonacionesService>(DonacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
