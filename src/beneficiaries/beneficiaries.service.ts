import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beneficiary } from '../entities/beneficiary.entity';
import { User } from '../entities/user.entity';
import { NiumService } from '../common/nium/nium.service';

@Injectable()
export class BeneficiariesService {
  constructor(
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private niumService: NiumService,
  ) {}

  async create(user: User, data: Partial<Beneficiary>): Promise<Beneficiary> {
    const beneficiary = this.beneficiariesRepository.create({
      ...data,
      user,
    });

    // Fetch full user from DB — req.user from JWT only has { id, email }
    const fullUser = await this.usersRepository.findOne({ where: { id: user.id } });

    // If user is KYC verified, sync with Nium
    if (fullUser?.niumCustomerHash) {
      try {
        const niumRes = await this.niumService.addBeneficiary(fullUser.niumCustomerHash, {
          name: data.name!,
          accountNumber: data.accountNumber!,
          bankName: data.bankName!,
          ifscCode: data.ifscCode!,
          address: (data as any).address || '',
          city: (data as any).city || '',
          postcode: (data as any).postcode || '',
        });
        beneficiary.niumBeneficiaryHash = niumRes.beneficiaryHashId;
        beneficiary.niumPayoutHash = niumRes.payoutHashId;
      } catch (err: any) {
        const msg = err?.response?.message || err?.message || 'Failed to sync beneficiary to Nium';
        throw new Error(msg);
      }
    }

    return this.beneficiariesRepository.save(beneficiary);
  }

  async findAll(user: User): Promise<Beneficiary[]> {
    return this.beneficiariesRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<Beneficiary | null> {
    return this.beneficiariesRepository.findOne({
      where: { id, user: { id: user.id } },
    });
  }

}
