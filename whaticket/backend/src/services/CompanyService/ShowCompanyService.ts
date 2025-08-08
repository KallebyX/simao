import Company from "../../models/Company";
import AppError from "../../errors/AppError";

const ShowCompanyService = async (id: string | number): Promise<Company> => {
  console.log("=== DEBUG SHOW COMPANY SERVICE ===");
  console.log("Buscando company com id:", id);
  
  const company = await Company.findByPk(id, {
    include: ["plan"]
  });
  
  console.log("company raw result:", company);
  console.log("company dataValues:", company?.dataValues);
  console.log("company.name:", company?.name);
  console.log("company.planId:", company?.planId);
  console.log("company.plan:", company?.plan);
  
  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  return company;
};

export default ShowCompanyService;
