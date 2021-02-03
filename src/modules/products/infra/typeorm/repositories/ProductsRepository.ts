import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';
import AppError from '@shared/errors/AppError';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = await this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const ids = products.map(product => product.id);
    const findProducts = await this.ormRepository.find({ id: In(ids) });

    if (ids.length !== findProducts.length) {
      throw new AppError('Missing product');
    }

    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsData = await this.findAllById(products);

    const productsResult = productsData.map(product => {
      const productFind = products.find(p => p.id === product.id);

      if (!productFind) {
        throw new AppError('Product not found.');
      }

      if (product.quantity < productFind.quantity) {
        throw new AppError('Insufficient inventory');
      }

      const updatedProduct = product;

      updatedProduct.quantity -= productFind.quantity;

      return updatedProduct;
    });

    await this.ormRepository.save(productsResult);

    return productsResult;
  }
}

export default ProductsRepository;
