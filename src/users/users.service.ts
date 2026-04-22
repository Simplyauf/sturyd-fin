import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, KYCStatus } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { NiumService } from '../common/nium/nium.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private niumService: NiumService,
  ) {}

  async verifyKycReal(userId: string, kycData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    mobile: string;
    address1: string;
    city: string;
    state: string;
    zipCode: string;
    ssn: string;
    document?: string;
  }): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const niumResponse = await this.niumService.onboardCustomer({
      email: user.email,
      ...kycData,
    });

    const customerHashId = niumResponse.customerHashId;

    // Step 2: Upload the document if provided
    if (kycData.document) {
      try {
        await this.niumService.uploadDocument(customerHashId, kycData.document);
        console.log(`[UsersService] Document upload successful for ${customerHashId}`);
      } catch (err) {
        console.error(`[UsersService] Document upload failed for ${customerHashId}`, err);
        // We don't throw here so the user is at least created
      }
    }

    user.niumCustomerHash = customerHashId;
    user.kycStatus = KYCStatus.VERIFIED; // In sandbox we can instantly verify or wait for webhook
    
    return this.usersRepository.save(user);
  }

  async create(email: string, passwordPlain: string): Promise<User> {
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'kycStatus'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updateKycStatus(id: string, status: any): Promise<void> {
    await this.usersRepository.update(id, { kycStatus: status });
  }

  async findByNiumHash(niumCustomerHash: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { niumCustomerHash } });
  }

  async findAll() {
    return this.usersRepository.find();
  }
}


