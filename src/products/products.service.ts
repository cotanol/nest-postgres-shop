import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage } from './entities/product-image.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService'); // Logger for this service

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly dataSource: DataSource, // Data source for transactions
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto; // Destructure the DTO
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map((image) =>
          this.productImageRepository.create({ url: image }),
        ), // Create product images
      });
      await this.productRepository.save(product); //grabamos en la BD
      return { ...product, images: images };
    } catch (error) {
      this.handleDBExceptions(error); // Handle database exceptions
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto; // Destructure pagination DTO

    const products = await this.productRepository.find({
      take: limit, // Limit the number of results
      skip: offset, // Offset for pagination
      relations: {
        images: true,
      },
    });
    return products.map((product) => ({
      ...product,
      images: product.images.map((img) => img.url),
    })); // Map the products to include image URLs
  }

  async findOne(term: string) {
    let product: Product | null;

    // Check if the term is a UUID
    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term }); // Find by UUID
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('UPPER(title) = :title or slug =: slug', {
          title: term.toUpperCase(), // Case insensitive search
          slug: term.toLocaleLowerCase(), // Case insensitive search
        })
        .leftJoinAndSelect('prd.images', 'prodImages') // Join with images
        .getOne(); // Find by title or slug
    }

    if (!product) {
      throw new NotFoundException(`Product with uuid "${term}" not found`); // Handle not found case
    }
    return product;
  }

  async findOnePlain(term: string) {
    const { images = [], ...product } = await this.findOne(term); // Find the product
    return {
      ...product,
      images: images.map((img) => img.url), // Map the images to URLs
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...toUpdate } = updateProductDto; // Destructure the DTO

    const product = await this.productRepository.preload({
      id, // Preload the product with the given ID
      ...toUpdate, // Update with the new data, //temporal
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`); // Handle not found case
    }

    // Update images if provided
    const queryRunner = this.dataSource.createQueryRunner(); // Create a query runner for transactions
    await queryRunner.connect(); // Connect to the database
    await queryRunner.startTransaction(); // Start a transaction

    try {
      if (images) {
        // Check if images are provided
        await queryRunner.manager.delete(ProductImage, { product: { id } }); // Delete existing images
        product.images = images.map(
          (image) => this.productImageRepository.create({ url: image }), // Create new images
        );
      }
      await queryRunner.manager.save(product); // Save the product with new images

      await queryRunner.commitTransaction(); // Commit the transaction
      await queryRunner.release(); // Release the query runner

      return this.findOnePlain(id); // Return the updated product
    } catch (error) {
      await queryRunner.rollbackTransaction(); // Rollback the transaction on error
      await queryRunner.release(); // Release the query runner

      this.handleDBExceptions(error); // Handle database exceptions
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id); // Check if the product exists
    await this.productRepository.delete(id); // Se podria usar el remove tambien
    return product; // Delete the product by ID
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      // Duplicate key error code for PostgreSQL
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check logs');
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product'); // Create a query builder for products
    try {
      return await query.delete().where({}).execute(); // Delete all products
    } catch (error) {
      this.handleDBExceptions(error); // Handle database exceptions
    }
  }
}
