import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Beneficiary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  bankName: string;

  @Column()
  accountNumber: string;

  @Column()
  ifscCode: string;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  postcode: string;

  @Column({ nullable: true })
  niumBeneficiaryHash: string;

  @Column({ nullable: true })
  niumPayoutHash: string;

  @ManyToOne(() => User, (user) => user.beneficiaries)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
