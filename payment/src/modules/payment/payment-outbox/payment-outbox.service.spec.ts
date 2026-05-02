import { Test, TestingModule } from '@nestjs/testing';
import { PaymentOutboxService } from './payment-outbox.service';

describe('PaymentOutboxService', () => {
  let service: PaymentOutboxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentOutboxService],
    }).compile();

    service = module.get<PaymentOutboxService>(PaymentOutboxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
