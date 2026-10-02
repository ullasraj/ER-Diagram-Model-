export interface EntityPreset {
  id: string;
  name: string;
  description: string;
  files: { id: string; fileName: string; code: string }[];
}

export const SAMPLE_PRESETS: EntityPreset[] = [
  {
    id: 'ecommerce',
    name: 'E-Commerce Platform',
    description: 'Complete e-commerce model with Users, Orders, OrderItems, Products, Categories, and Payments.',
    files: [
      {
        id: 'user-ts',
        fileName: 'User.ts',
        code: `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Order } from './Order';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  fullName: string;

  @Column({ type: 'enum', enum: ['customer', 'admin'], default: 'customer' })
  role: string;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}`,
      },
      {
        id: 'category-ts',
        fileName: 'Category.ts',
        code: `import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Product } from './Product';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @ManyToOne(() => Category, (category) => category.subcategories, { nullable: true })
  parentCategory: Category;

  @OneToMany(() => Category, (category) => category.parentCategory)
  subcategories: Category[];

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}`,
      },
      {
        id: 'product-ts',
        fileName: 'Product.ts',
        code: `import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Category } from './Category';
import { OrderItem } from './OrderItem';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems: OrderItem[];
}`,
      },
      {
        id: 'order-ts',
        fileName: 'Order.ts',
        code: `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { User } from './User';
import { OrderItem } from './OrderItem';
import { Payment } from './Payment';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'enum', enum: ['pending', 'paid', 'shipped', 'cancelled'], default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment;
}`,
      },
      {
        id: 'orderitem-ts',
        fileName: 'OrderItem.ts',
        code: `import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './Order';
import { Product } from './Product';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}`,
      },
      {
        id: 'payment-ts',
        fileName: 'Payment.ts',
        code: `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Order } from './Order';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  transactionReference: string;

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'boolean', default: false })
  isSuccess: boolean;

  @CreateDateColumn()
  paidAt: Date;

  @OneToOne(() => Order, (order) => order.payment)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}`,
      },
    ],
  },
  {
    id: 'social-media',
    name: 'Social Network & Blog',
    description: 'Social platform with User Profiles, Posts, Comments, Likes, and Hashtags (ManyToMany).',
    files: [
      {
        id: 'user-social',
        fileName: 'User.ts',
        code: `import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from 'typeorm';
import { UserProfile } from './UserProfile';
import { Post } from './Post';
import { Comment } from './Comment';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile: UserProfile;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];
}`,
      },
      {
        id: 'userprofile-social',
        fileName: 'UserProfile.ts',
        code: `import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'varchar', nullable: true })
  website: string;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;
}`,
      },
      {
        id: 'post-social',
        fileName: 'Post.ts',
        code: `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { User } from './User';
import { Comment } from './Comment';
import { Tag } from './Tag';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @CreateDateColumn()
  publishedAt: Date;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @ManyToMany(() => Tag, (tag) => tag.posts)
  @JoinTable({ name: 'post_tags' })
  tags: Tag[];
}`,
      },
      {
        id: 'tag-social',
        fileName: 'Tag.ts',
        code: `import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Post } from './Post';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
}`,
      },
      {
        id: 'comment-social',
        fileName: 'Comment.ts',
        code: `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Post } from './Post';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;
}`,
      },
    ],
  },
  {
    id: 'saas-projects',
    name: 'SaaS Project Workspace',
    description: 'Multi-tenant SaaS with Organizations, Users, Projects, Tasks, and Activity Logs.',
    files: [
      {
        id: 'org-saas',
        fileName: 'Organization.ts',
        code: `import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Project } from './Project';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', unique: true })
  domain: string;

  @Column({ type: 'varchar', default: 'pro' })
  planTier: string;

  @OneToMany(() => Project, (project) => project.organization)
  projects: Project[];
}`,
      },
      {
        id: 'project-saas',
        fileName: 'Project.ts',
        code: `import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Organization } from './Organization';
import { Task } from './Task';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @ManyToOne(() => Organization, (org) => org.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];
}`,
      },
      {
        id: 'task-saas',
        fileName: 'Task.ts',
        code: `import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './Project';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'enum', enum: ['todo', 'in_progress', 'completed'], default: 'todo' })
  status: string;

  @Column({ type: 'enum', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' })
  priority: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}`,
      },
    ],
  },
];
