import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Contact from "./Contact";

@Table
class ContactCustomField extends Model<ContactCustomField> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column
  name: string;

  @Column
  value: string;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}

export default ContactCustomField;
