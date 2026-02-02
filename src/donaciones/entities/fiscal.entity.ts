import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Fiscal {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  persona: string;
  
  @Column()
  @Index()
  razonSocial: string;

  @Column()
  regimenFiscal: string;

  @Column()
  usoCfdi: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  rfcCipherText: string;

  @Column()
  rfcIv: string;

  @Column()
  rfcAuthTag: string;

  @Column()
  direccionCipherText: string;

  @Column()
  direccionIv: string;

  @Column()
  direccionAuthTag: string;
}