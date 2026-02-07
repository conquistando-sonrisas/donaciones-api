import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { RecurringDonacion } from "./recurring-donacion.entity";


@Entity()
export class ActionToken {

  @PrimaryColumn({
    type: 'uuid',
    default: () => 'gen_random_uuid()'
  })
  id: string;

  @Column()
  action: string;

  @Column()
  reason: string;

  @Column()
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @ManyToOne(() => RecurringDonacion, recurring => recurring.actionToken)
  @JoinColumn({ name: 'idRecurringDonacion' })
  recurringDonacion: RecurringDonacion;

  @Column({ type: 'varchar', nullable: true })
  idRecurringDonacion: string | null;
}