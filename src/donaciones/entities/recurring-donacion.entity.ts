import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Unique } from "typeorm";
import { Donador } from "./donador.entity";
import { Action } from "rxjs/internal/scheduler/Action";
import { ActionToken } from "./action-token.entity";


@Entity()
export class RecurringDonacion {

  @PrimaryColumn({
    type: 'uuid',
    default: () => 'gen_random_uuid()'
  })
  id: string;

  @Column({ unique: true })
  mercadoPagoPreapprovalId: string;

  @Column()
  status: string;

  @Column()
  frequency: number;

  @Column()
  frequencyType: string;

  @Column()
  monto: number;

  @Column({ type: 'date', nullable: true })
  cancelledAt: Date | null;

  @ManyToOne(() => Donador, donador => donador.recurrionDonaciones)
  @JoinColumn({ name: 'idDonador' })
  donador: Donador;

  @Column({ type: 'varchar', nullable: true })
  idDonador: string | null;

  @OneToMany(() => ActionToken, action => action.recurringDonacion)
  actionToken: ActionToken;
}