import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    private readonly productsService: ProductsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async runSeed() {
    await this.deleteTables();
    const adminUser = await this.insertUsers();
    await this.insertNewProducts(adminUser);

    return 'SEED executed';
  }

  private async deleteTables() {
    // delete Products
    await this.productsService.deleteAllProducts();
    // delete Users
    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder.delete().where({}).execute();
  }

  private async insertUsers() {
    const seedUser = initialData.users;

    const users: User[] = [];

    seedUser.forEach((user) => {
      user.password = bcrypt.hashSync(user.password, 10); // Hashing the password
      users.push(this.userRepository.create(user));
    });

    await this.userRepository.save(users);

    return users[0]; // Return the first user as admin
  }

  private async insertNewProducts(user: User) {
    const products = initialData.products;

    const insertPromises: Promise<any>[] = [];

    products.forEach((product) => {
      insertPromises.push(this.productsService.create(product, user));
    });

    await Promise.all(insertPromises);

    return true;
  }
}
