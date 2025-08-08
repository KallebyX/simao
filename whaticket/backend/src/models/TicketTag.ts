import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Tag from "./Tag";
import Ticket from "./Ticket";

@Table({
  tableName: 'TicketTags'
})
class TicketTag extends Model<TicketTag> {
  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @ForeignKey(() => Tag)
  @Column
  tagId: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @BelongsTo(() => Tag)
  tag: Tag;
}

export default TicketTag;
