import Setting from "../../models/Setting";
import { QueryTypes } from "sequelize";
import sequelize from "../../database";

interface Request {
  key: string;
}

const publicSettingsKeys = [
  "allowSignup",
  "primaryColorLight",
  "primaryColorDark",
  "appLogoLight",
  "appLogoDark",
  "appLogoFavicon",
  "appName"
]

const GetPublicSettingService = async ({
  key
}: Request): Promise<string | undefined> => {
  

  console.log("|======== GetPublicSettingService ========|")
  console.log("key", key)
  console.log("|=========================================|")

  if (!publicSettingsKeys.includes(key)) {
    return null;
  }
  
  try {
    const result = await sequelize.query(
      'SELECT value FROM "Settings" WHERE "companyId" = 1 AND key = :key LIMIT 1',
      {
        replacements: { key },
        type: QueryTypes.SELECT
      }
    );

    return (result[0] as any)?.value || null;
  } catch (error) {
    console.log("Error fetching setting:", error);
    return null;
  }
};

export default GetPublicSettingService;
