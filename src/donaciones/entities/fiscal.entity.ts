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

  @Column()
  @Index()
  rfc: string;

  @CreateDateColumn()
  createdAt: Date

  @Column()
  direccion: string;
}