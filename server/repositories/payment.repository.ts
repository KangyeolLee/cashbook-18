import {
  EntityRepository,
  Repository,
  InsertResult,
  DeleteResult,
} from 'typeorm';
import UserPayment from './../entities/UserPayment';
import Payment from './../entities/Payment';
import { UserPaymentForRemoval, UserPaymentType } from '../types/types';

@EntityRepository(UserPayment)
export class UserPaymentRepository extends Repository<UserPayment> {
  findAllByUserId(userId: number): Promise<UserPayment[] | undefined> {
    return this.createQueryBuilder('user_payment')
      .select('payment.type AS type, user_payment.id AS id')
      .leftJoin('user_payment.payment', 'payment')
      .where('user_payment.userId = :userId', { userId })
      .getRawMany();
  }

  createUserPaymentByUserId({
    userId,
    paymentId,
  }: UserPaymentType): Promise<InsertResult> {
    const result = this.create({
      user: { id: userId },
      payment: { id: paymentId },
    });
    return this.insert(result);
  }

  deleteUserPaymentByUserId({
    userId,
    id,
  }: UserPaymentForRemoval): Promise<DeleteResult> {
    return this.delete({ id, user: { id: userId } });
  }
}

@EntityRepository(Payment)
export class PaymentRepository extends Repository<Payment> {
  createPaymentForUser(type: string): Promise<InsertResult> {
    const result = this.create({ type });
    return this.insert(result);
  }
}