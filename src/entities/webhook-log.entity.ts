import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  event: string; // e.g. PAYIN_SUCCESS, PAYOUT_SETTLED, PAYOUT_FAILED

  @Column({ nullable: true })
  transactionId: string;

  @Column({ type: 'text' })
  payload: string; // raw JSON string

  @Column({ nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
