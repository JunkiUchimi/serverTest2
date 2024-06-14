const KANACONVERTER_PATH = "./KanaConverter";
const TRANSFER_LIST_PATH = "../templates/json/transfer_field_2.7.json";
const OFFISTA_CLASS_PATH = "./Offista";
const KanaConverter_class = require(KANACONVERTER_PATH);
const TRANSFER_LIST = require(TRANSFER_LIST_PATH);
const KanaConverter = new KanaConverter_class();
const Offista = require(OFFISTA_CLASS_PATH);

module.exports = class DataUploader {
  constructor() {
    this.offistaInstance = new Offista({ is_dumpLog: false });
  }

  convertKintoneToOffista(kintoneRecord, transferFields) {
    let returnObj = { relationship: 0, memo: "" };
    transferFields.forEach((element) => {
      const from = element.from;
      const dest = element.dest;
      const type = element.type;

      let value
      if (from == null)
        value == ""
      else {
        const recordObj = kintoneRecord[from];

        if (recordObj === undefined) {
          const error_message = `key "${from}" is not defined.\nPlease change the file "${TRANSFER_LIST_PATH}"`;
          console.error(error_message);
          return;
        }
        value = recordObj.value;

        switch (type) {
          case undefined:
            break;
          case "hyphen":
              if (!value.includes("-")) {
                let formattedNumber =
                  value.substring(0, 4) +
                  "-" +
                  value.substring(4, 6) +
                  "-" +
                  value.substring(6);
                value = formattedNumber;
              }
          break;
          case "full":
            value = KanaConverter.halfToFull(value);
            break;
          case "half":
            value = KanaConverter.fullToHalf(value);
            break;
          case "boolean":
            switch (dest) {
              case "is_foreigner":
                if (value === "日本人") value = 0;
                else value = 1;
                break;
              case "health_division":
                if (value === "加入する") value = 1;
                else value = 0;
                break;
              case "welfare_annuity_division":
                if (value === "加入する") value = 1;
                else value = 0;
                break;
              case "employment_insurance_division":
                if (value === "加入する") value = 1;
                else value = 0;
                break;
              default:
                console.error(
                  `"${type}/${dest}" is not defined in this program.`
                );
                return;
            }
            break;
          case "int":
            switch (dest) {
              case "contract_period_determined":
                if (value === "期間の定めあり") value = 1;
                else if (value === "期間の定めなし") value = 2;
                else value = 0;
                break;
              case "activity_out_qualification":
                if (value === "有") value = 1;
                else if (value === "無") value = 2;
                break;
              case "dispatch_contract_working_classification":
                if (value === "該当") value = 1;
                else if (value === "非該当") value = 2;
                break;
              case "sex":
                if (value === "男") value = 1;
                else if (value === "女") value = 2;
                break;
              case "living_together":
                if (value === "同居") value = 1;
                else if (value === "別居") value = 2;
                else value = 0;
                break;
              case "loss_qualification_reason_employ":
                switch (value) {
                  case "自己都合による退職":
                    value = 2
                    break;
                  case "契約期間満了":
                    value = 0
                    break;
                  case "退職勧奨":
                    value = 0
                    break;
                  case "会社都合":
                    value = 3
                    break;
                  case "関連会社移籍":
                    value = 0
                    break;
                  case "その他":
                    value = 0
                    break;
                  default:
                    value = 0
                }
                break;
              case "relationship":
                // 1夫、2妻、3内縁の夫、4内縁の妻
                switch (value) {
                  case "夫":
                    value = 1;
                    break;
                  case "妻":
                    value = 2;
                    break;
                  case "父":
                    value = 3;
                    break;
                  case "母":
                    value = 4;
                    break;
                  case "子":
                    value = 5;
                    break;
                  case "兄":
                    value = 6;
                    break;
                  case "弟":
                    value = 7;
                    break;
                  case "姉":
                    value = 8;
                    break;
                  case "妹":
                    value = 9;
                    break;
                  case "祖父":
                    value = 10;
                    break;
                  case "祖母":
                    value = 11;
                    break;
                  case "孫":
                    value = 12;
                    break;
                  case "その他":
                    break;
                  default:
                    returnObj["relationship_detail"] = value;
                    value = 99;
                }
                break;
              case "tax_law_support_add_reason":
                if (value == null) break;
                value = value.split(".")[0]
                switch (value) {
                  case "0":
                    value = 1
                    break;
                  case "1":
                    value = 31
                    break;
                  case "2":
                    value = 32
                    break;
                  case "3":
                    value = 33
                    break;
                  case "4":
                    value = 34
                    break;
                  case "5":
                    value = 35
                    break;
                  default:
                    value = 35
                    break;
                }
                break;
              default:
                console.error(
                  `"${type}/${dest}" is not defined in this program.`
                );
                console.log(value);
                return;
            }
            break;
          case "divide by 1000":
            value = String(Number(value) / 1000);
            break;
          case "remove hyphen":
            value = value.replaceAll("-", "");
            break;
          case "insert tel hyphen":
            if (value = "") {
              value = "000-0000-0000"
            }
            else if (!value.includes("-")) {
              let formattedNumber =
                value.substring(0, 3) +
                "-" +
                value.substring(3, 7) +
                "-" +
                value.substring(7);
              value = formattedNumber;
            }
            break;
          default:
            console.error(`the type "${type}/${dest}" is not defined in program`);
            return;
        }
      }

      if (dest === "memo") returnObj.memo += `${from}=${value}\n`;
      else returnObj[dest] = value;
    });

    return returnObj;
  }

  sync_personal_OffistaData(record) {
    const essential = TRANSFER_LIST.essential.fields;
    const enrollResidency = TRANSFER_LIST.enroll_residency.fields;
    const enrollSocialInsurance = TRANSFER_LIST.enroll_social_insurance.fields;
    const enrollEmploymentInsurance =
      TRANSFER_LIST.enroll_employment_insurance.fields;
    const retire = TRANSFER_LIST.retire.fields;

    const transferFields = essential.concat(
      enrollResidency,
      enrollSocialInsurance,
      enrollEmploymentInsurance,
      retire
    );
    return this.convertKintoneToOffista(record, transferFields);
  }

  async backupAddress(companyName) {

  }

  sync_family_OffistaData(record) {
    let family_obj = [];
    
  }

  async checkCompanyResist(companyName) {
    let result = await this.offistaInstance.get_consignment_customer();

    let stationId = "";
    result.forEach((element) => {
      if (element.customer_name === companyName) stationId = element.identifier;
    });

    if (stationId === "")
      console.error(
        `"${companyName}" is not defined on the office station server.`
      );
    return stationId;
  }

  async upload(companyName, dataObj) {
    this.stationId = await this.checkCompanyResist(companyName);
    if (this.stationId === "")
      return {
        is_successed: false,
        error_message: `"${companyName}" is not defined on the office station server.`,
      };
    try {
      const resistResult = await this.offistaInstance.entry_employee(
        this.stationId,
        [dataObj]
      );

      if (!resistResult.is_successed) {
        console.error(
          `Failed to entry employee data.\n${resistResult.error_message}`
        );
        if (
          resistResult.error_message.includes(
            "既に登録されている従業員が存在します"
          )
        ) {
          return this.update(companyName, dataObj);
        } else
          return {
            is_successed: false,
            error_message: resistResult.error_message,
          };
      }

      return { is_successed: true, error_message: "" };
    } catch (e) {
      console.error(e);
      return { is_successed: false, error_message: e.message || e };
    }
  }

  async update(companyName, dataObj) {
    this.stationId = await this.checkCompanyResist(companyName);
    if (this.stationId === "")
      return {
        is_successed: false,
        error_message: `"${companyName}" is not defined on the office station server.`,
      };
    try {
      const resistResult = await this.offistaInstance.modify_employee(
        this.stationId,
        [dataObj]
      );

      if (!resistResult.is_successed) {
        console.error(
          `Failed to modefy employee data.\n${resistResult.error_message}`
        );
        return {
          is_successed: false,
          error_message: resistResult.error_message,
        };
      } else return { is_successed: true, error_message: "" };
    } catch (e) {
      console.error(e);
      return { is_successed: false, error_message: e.message || e };
    }
  }

  async sync(kintoneRecord) {
    const companyName = kintoneRecord["会社名"].value;
    const personal_data = await this.sync_personal_OffistaData(kintoneRecord);
    const family_data = await this.sync_family_OffistaData(kintoneRecord);


    const upload_data = { ...personal_data, ...{ family: family_data } };
    // const upload_data = { ...personal_data };
    console.log("upload_data: ", upload_data)
    // return upload_data
    return await this.upload(companyName, upload_data);
  }
};
