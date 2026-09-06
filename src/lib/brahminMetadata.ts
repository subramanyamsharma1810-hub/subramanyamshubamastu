export interface SubCasteInfo {
  id: string;
  labelEn: string;
  labelTe: string;
}

export interface GotramInfo {
  id: string;
  labelEn: string;
  labelTe: string;
}

export const BRAHMIN_SUB_CASTES: SubCasteInfo[] = [
  { id: "vaidiki-velanadu", labelEn: "Vaidiki Velanadu (వైదిక వేలనాటి)", labelTe: "వైదిక వేలనాటి" },
  { id: "vaidiki-mulakanadu", labelEn: "Vaidiki Mulakanadu (వైదిక ములకనాటి)", labelTe: "వైదిక ములకనాటి" },
  { id: "vaidiki-telaganya", labelEn: "Vaidiki Telaganya (వైదిక తెలగాణ్య)", labelTe: "వైదిక తెలగాణ్య" },
  { id: "vaidiki-veginadu", labelEn: "Vaidiki Veginadu (వైదిక వేగినాటి)", labelTe: "వైదిక వేగినాటి" },
  { id: "vaidiki-kasalanadu", labelEn: "Vaidiki Kasalanadu (వైదిక కాసలనాటి)", labelTe: "వైదిక కాసలనాటి" },
  { id: "vaidiki-aruvela", labelEn: "Vaidiki Aruvela (వైదిక ఆరువేల)", labelTe: "వైదిక ఆరువేల" },
  { id: "niyogi-aruvela", labelEn: "Niyogi Aruvela (నియోగి ఆరువేల)", labelTe: "నియోగి ఆరువేల" },
  { id: "niyogi-nandavariki", labelEn: "Niyogi Nandavariki (నియోగి నందవారికి)", labelTe: "నియోగి నందవారికి" },
  { id: "niyogi-general", labelEn: "Niyogi General (నియోగి)", labelTe: "నియోగి" },
  { id: "dravida", labelEn: "Dravida (ద్రావిడ)", labelTe: "ద్రావిడ" },
  { id: "sri-vaishnava", labelEn: "Sri Vaishnava (శ్రీ వైష్ణవ)", labelTe: "శ్రీ వైష్ణవ" },
  { id: "smartha", labelEn: "Smartha (స్మార్త)", labelTe: "స్మార్త" },
  { id: "madhwa", labelEn: "Madhwa (మధ్వ)", labelTe: "మధ్వ" },
  { id: "prathamasakha", labelEn: "Prathamasakha (ప్రథమశాఖ)", labelTe: "ప్రథమశాఖ" },
  { id: "deshastha", labelEn: "Deshastha Smartha (దేశస్థ)", labelTe: "దేశస్థ" },
  { id: "konkanastha", labelEn: "Konkanastha (కొంకణస్థ)", labelTe: "కొంకణస్థ" },
  { id: "tengalai", labelEn: "Tengalai Sri Vaishnava (తెంగలై)", labelTe: "తెంగలై" },
  { id: "vadagalai", labelEn: "Vadagalai Sri Vaishnava (వడగలై)", labelTe: "వడగలై" },
  { id: "brahmin-other", labelEn: "Other Brahmin Sects (ఇతర బ్రాహ్మణ శాఖ)", labelTe: "ఇతర బ్రాహ్మణ శాఖ" }
];

export const REDDY_SUB_CASTES: SubCasteInfo[] = [
  { id: "motati-reddy", labelEn: "Motati Reddy (మోటాటి రెడ్డి)", labelTe: "మోటాటి రెడ్డి" },
  { id: "pakanati-reddy", labelEn: "Pakanati Reddy (పాకనాటి రెడ్డి)", labelTe: "పాకనాటి రెడ్డి" },
  { id: "palle-reddy", labelEn: "Palle Reddy (పల్లె రెడ్డి)", labelTe: "పల్లె రెడ్డి" },
  { id: "gampa-reddy", labelEn: "Gampa Reddy (గంపా రెడ్డి)", labelTe: "గంపా రెడ్డి" },
  { id: "chowti-reddy", labelEn: "Chowti Reddy (చౌటి రెడ్డి)", labelTe: "చౌటి రెడ్డి" },
  { id: "kona-reddy", labelEn: "Kona Reddy (కోన రెడ్డి)", labelTe: "కోన రెడ్డి" },
  { id: "yeruma-reddy", labelEn: "Yeruma Reddy (ఎరుమ రెడ్డి)", labelTe: "ఎరుమ రెడ్డి" },
  { id: "general-reddy", labelEn: "General / All Reddy Sub-Castes (అన్ని రెడ్డి శాఖలు)", labelTe: "అన్ని రెడ్డి శాఖలు" }
];

export const KAMMA_SUB_CASTES: SubCasteInfo[] = [
  { id: "vadaga-kamma", labelEn: "Vadaga Kamma (వడగ కమ్మ)", labelTe: "వడగ కమ్మ" },
  { id: "illuventla-kamma", labelEn: "Illuventla Kamma (ఇల్లువెండ్ల కమ్మ)", labelTe: "ఇల్లువెండ్ల కమ్మ" },
  { id: "pedakanti-kamma", labelEn: "Pedakanti Kamma (పెదకాంతి కమ్మ)", labelTe: "పెదకాంతి కమ్మ" },
  { id: "bangarugallu", labelEn: "Bangarugallu (బంగారుగళ్ళు)", labelTe: "బంగారుగళ్ళు" },
  { id: "general-kamma", labelEn: "General / All Kamma Sub-Castes (అన్ని కమ్మ శాఖలు)", labelTe: "అన్ని కమ్మ శాఖలు" }
];

export const KAPU_SUB_CASTES: SubCasteInfo[] = [
  { id: "telaga", labelEn: "Telaga (తెలగ)", labelTe: "తెలగ" },
  { id: "balija", labelEn: "Balija (బలిజ)", labelTe: "బలిజ" },
  { id: "ontari", labelEn: "Ontari (ఒంటరి)", labelTe: "ఒంటరి" },
  { id: "turpu-kapu", labelEn: "Turpu Kapu (తుర్పు కాపు)", labelTe: "తుర్పు కాపు" },
  { id: "munnuru-kapu", labelEn: "Munnuru Kapu (మున్నూరు కాపు)", labelTe: "మున్నూరు కాపు" },
  { id: "general-kapu", labelEn: "General / All Kapu Sub-Castes (అన్ని కాపు శాఖలు)", labelTe: "అన్ని కాపు శాఖలు" }
];

export const CHOUDARY_SUB_CASTES: SubCasteInfo[] = [
  { id: "general-choudary", labelEn: "Choudary General (చౌదరి జనరల్)", labelTe: "చౌదరి జనరల్" }
];

export const BRAHMIN_GOTRAMS: GotramInfo[] = [
  { id: "srivatsa", labelEn: "Srivatsa (శ్రీవత్స)", labelTe: "శ్రీవత్స" },
  { id: "bharadwaja", labelEn: "Bharadwaja (భరద్వాజ)", labelTe: "భరద్వాజ" },
  { id: "kasyapa", labelEn: "Kasyapa (కశ్యప)", labelTe: "కశ్యప" },
  { id: "atreya", labelEn: "Atreya (ఆత్రేయ)", labelTe: "ఆత్రేయ" },
  { id: "haritasa", labelEn: "Haritasa / Harita (హరితస)", labelTe: "హరితస" },
  { id: "koundinya", labelEn: "Koundinya (కౌండిన్య)", labelTe: "కౌండిన్య" },
  { id: "gautama", labelEn: "Gautama (గౌతమ)", labelTe: "గౌతమ" },
  { id: "vasishtha", labelEn: "Vasishtha (వసిష్ఠ)", labelTe: "వసిష్ఠ" },
  { id: "vishwamitra", labelEn: "Vishwamitra (విశ్వామిత్ర)", labelTe: "విశ్వామిత్ర" },
  { id: "jamadagni", labelEn: "Jamadagni (జమదగ్ని)", labelTe: "జమదగ్ని" },
  { id: "naidhruva", labelEn: "Naidhruva (నైధ్రువ)", labelTe: "నైధ్రువ" },
  { id: "sandilya", labelEn: "Sandilya (శాండిల్య)", labelTe: "శాండిల్య" },
  { id: "parasara", labelEn: "Parasara (పరాశర)", labelTe: "పరాశర" },
  { id: "gargya", labelEn: "Gargya (గార్గ్య)", labelTe: "గార్గ్య" },
  { id: "shatamarshana", labelEn: "Shatamarshana (శఠమర్షణ)", labelTe: "శఠమర్షణ" },
  { id: "mudgala", labelEn: "Mudgala (ముద్గల)", labelTe: "ముద్గల" },
  { id: "agastya", labelEn: "Agastya (అగస్త్య)", labelTe: "అగస్త్య" },
  { id: "bhargava", labelEn: "Bhargava (భార్గవ)", labelTe: "భార్గవ" },
  { id: "lohita", labelEn: "Lohita (లోహిత)", labelTe: "లోహిత" },
  { id: "upamanyu", labelEn: "Upamanyu (ఉపమన్యు)", labelTe: "ఉపమన్యు" },
  { id: "kausika", labelEn: "Kausika (కౌశిక)", labelTe: "కౌశిక" },
  { id: "kanva", labelEn: "Kanva (కణ్వ)", labelTe: "కణ్వ" },
  { id: "angirasa", labelEn: "Angirasa (అంగీరస)", labelTe: "అంగీరస" },
  { id: "vatsa", labelEn: "Vatsa (వత్స)", labelTe: "వత్స" },
  { id: "salankayana", labelEn: "Salankayana (సాలంకాయన)", labelTe: "సాలంకాయన" },
  { id: "kapi", labelEn: "Kapi (కపి)", labelTe: "కపి" },
  { id: "babhravya", labelEn: "Babhravya (బభ్రవ్య)", labelTe: "బభ్రవ్య" },
  { id: "maudgalyasya", labelEn: "Maudgalyasya (మౌద్గల్యస)", labelTe: "మౌద్గల్యస" },
  { id: "shounaka", labelEn: "Shounaka (శౌనక)", labelTe: "శౌనక" },
  { id: "other-gotram", labelEn: "Other Gotram (ఇతర గోత్రం)", labelTe: "ఇతర గోత్రం" }
];

export const REDDY_GOTRAMS: GotramInfo[] = [
  { id: "siva-gotra", labelEn: "Siva Gotra (శివ గోత్రం)", labelTe: "శివ గోత్రం" },
  { id: "vishnu-gotra", labelEn: "Vishnu Gotra (విష్ణు గోత్రం)", labelTe: "విష్ణు గోత్రం" },
  { id: "surya-gotra", labelEn: "Surya Gotra (సూర్య గోత్రం)", labelTe: "సూర్య గోత్రం" },
  { id: "bharadwaja", labelEn: "Bharadwaja (భరద్వాజ గోత్రం)", labelTe: "భరద్వాజ" },
  { id: "kasyapa", labelEn: "Kasyapa (కశ్యప గోత్రం)", labelTe: "కశ్యప" },
  { id: "srivatsa", labelEn: "Srivatsa (శ్రీవత్స గోత్రం)", labelTe: "శ్రీవత్స" },
  { id: "atreya", labelEn: "Atreya (ఆత్రేయ గోత్రం)", labelTe: "ఆత్రేయ" },
  { id: "gautama", labelEn: "Gautama (గౌతమ గోత్రం)", labelTe: "గౌతమ" },
  { id: "other-gotram", labelEn: "Other / Family Intiperu Gotram (ఇతర గోత్రం)", labelTe: "ఇతర గోత్రం" }
];

export const GENERAL_GOTRAMS: GotramInfo[] = [
  ...BRAHMIN_GOTRAMS,
  { id: "siva-gotra", labelEn: "Siva Gotra (శివ గోత్రం)", labelTe: "శివ గోత్రం" },
  { id: "vishnu-gotra", labelEn: "Vishnu Gotra (విష్ణు గోత్రం)", labelTe: "విష్ణు గోత్రం" },
  { id: "general-gotra", labelEn: "General / Family Gotram (సాధారణ గోత్రం)", labelTe: "సాధారణ గోత్రం" }
];

