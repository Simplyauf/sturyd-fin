import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Beneficiary } from './beneficiary.entity';

export enum TransactionStatus {
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAYIN_COMPLETED = 'PAYIN_COMPLETED',
  PAYOUT_INITIATED = 'PAYOUT_INITIATED',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  sourceAmount: number;

  @Column({ default: 'USD' })
  sourceCurrency: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  destinationAmount: number;

  @Column({ default: 'INR' })
  destinationCurrency: string;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  exchangeRate: number;

  @Column({
    type: 'simple-enum',
    enum: TransactionStatus,
    default: TransactionStatus.AWAITING_PAYMENT,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  externalReference: string; // e.g. Nium System Reference

  @ManyToOne(() => User, (user) => user.transactions)
  user: User;

  @ManyToOne(() => Beneficiary)
  beneficiary: Beneficiary;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
