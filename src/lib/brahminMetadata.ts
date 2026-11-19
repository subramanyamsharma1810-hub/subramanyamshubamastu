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
  { id: "brahmin-vaidiki-velanadu", labelEn: "Vaidiki Velanadu (వైదిక వేలనాటి)", labelTe: "వైదిక వేలనాటి" },
  { id: "brahmin-vaidiki-mulakanadu", labelEn: "Vaidiki Mulakanadu (వైదిక ములకనాటి)", labelTe: "వైదిక ములకనాటి" },
  { id: "brahmin-vaidiki-telaganya", labelEn: "Vaidiki Telaganya (వైదిక తెలగాణ్య)", labelTe: "వైదిక తెలగాణ్య" },
  { id: "brahmin-vaidiki-veginadu", labelEn: "Vaidiki Veginadu (వైదిక వేగినాటి)", labelTe: "వైదిక వేగినాటి" },
  { id: "brahmin-vaidiki-kasalanadu", labelEn: "Vaidiki Kasalanadu (వైదిక కాసలనాటి)", labelTe: "వైదిక కాసలనాటి" },
  { id: "brahmin-vaidiki-aruvela", labelEn: "Vaidiki Aruvela (వైదిక ఆరువేల)", labelTe: "వైదిక ఆరువేల" },
  { id: "brahmin-niyogi-aruvela", labelEn: "Niyogi Aruvela (నియోగి ఆరువేల)", labelTe: "నియోగి ఆరువేల" },
  { id: "brahmin-niyogi-nandavariki", labelEn: "Niyogi Nandavariki (నియోగి నందవారికి)", labelTe: "నియోగి నందవారికి" },
  { id: "brahmin-niyogi-general", labelEn: "Niyogi General (నియోగి)", labelTe: "నియోగి" },
  { id: "brahmin-dravida", labelEn: "Dravida (ద్రావిడ)", labelTe: "ద్రావిడ" },
  { id: "brahmin-sri-vaishnava", labelEn: "Sri Vaishnava (శ్రీ వైష్ణవ)", labelTe: "శ్రీ వైష్ణవ" },
  { id: "brahmin-smartha", labelEn: "Smartha (స్మార్త)", labelTe: "స్మార్త" },
  { id: "brahmin-madhwa", labelEn: "Madhwa (మధ్వ)", labelTe: "మధ్వ" },
  { id: "brahmin-prathamasakha", labelEn: "Prathamasakha (ప్రథమశాఖ)", labelTe: "ప్రథమశాఖ" },
  { id: "brahmin-deshastha", labelEn: "Deshastha Smartha (దేశస్థ)", labelTe: "దేశస్థ" },
  { id: "brahmin-konkanastha", labelEn: "Konkanastha (కొంకణస్థ)", labelTe: "కొంకణస్థ" },
  { id: "brahmin-tengalai", labelEn: "Tengalai Sri Vaishnava (తెంగలై)", labelTe: "తెంగలై" },
  { id: "brahmin-vadagalai", labelEn: "Vadagalai Sri Vaishnava (వడగలై)", labelTe: "వడగలై" },
  { id: "brahmin-other", labelEn: "Other Brahmin Sects (ఇతర బ్రాహ్మణ శాఖ)", labelTe: "ఇతర బ్రాహ్మణ శాఖ" }
];

export const REDDY_SUB_CASTES: SubCasteInfo[] = [
  { id: "reddy-motati", labelEn: "Motati Reddy (మోటాటి రెడ్డి)", labelTe: "మోటాటి రెడ్డి" },
  { id: "reddy-pakanati", labelEn: "Pakanati Reddy (పాకనాటి రెడ్డి)", labelTe: "పాకనాటి రెడ్డి" },
  { id: "reddy-palle", labelEn: "Palle Reddy (పల్లె రెడ్డి)", labelTe: "పల్లె రెడ్డి" },
  { id: "reddy-gampa", labelEn: "Gampa Reddy (గంపా రెడ్డి)", labelTe: "గంపా రెడ్డి" },
  { id: "reddy-chowti", labelEn: "Chowti Reddy (చౌటి రెడ్డి)", labelTe: "చౌటి రెడ్డి" },
  { id: "reddy-kona", labelEn: "Kona Reddy (కోన రెడ్డి)", labelTe: "కోన రెడ్డి" },
  { id: "reddy-yeruma", labelEn: "Yeruma Reddy (ఎరుమ రెడ్డి)", labelTe: "ఎరుమ రెడ్డి" },
  { id: "reddy-general", labelEn: "General / All Reddy Sub-Castes (అన్ని రెడ్డి శాఖలు)", labelTe: "అన్ని రెడ్డి శాఖలు" }
];

export const KAMMA_SUB_CASTES: SubCasteInfo[] = [
  { id: "kamma-vadaga", labelEn: "Vadaga Kamma (వడగ కమ్మ)", labelTe: "వడగ కమ్మ" },
  { id: "kamma-illuventla", labelEn: "Illuventla Kamma (ఇల్లువెండ్ల కమ్మ)", labelTe: "ఇల్లువెండ్ల కమ్మ" },
  { id: "kamma-pedakanti", labelEn: "Pedakanti Kamma (పెదకాంతి కమ్మ)", labelTe: "పెదకాంతి కమ్మ" },
  { id: "kamma-bangarugallu", labelEn: "Bangarugallu (బంగారుగళ్ళు)", labelTe: "బంగారుగళ్ళు" },
  { id: "kamma-general", labelEn: "General / All Kamma Sub-Castes (అన్ని కమ్మ శాఖలు)", labelTe: "అన్ని కమ్మ శాఖలు" }
];

export const KAPU_SUB_CASTES: SubCasteInfo[] = [
  { id: "kapu-telaga", labelEn: "Telaga (తెలగ)", labelTe: "తెలగ" },
  { id: "kapu-balija", labelEn: "Balija (బలిజ)", labelTe: "బలిజ" },
  { id: "kapu-ontari", labelEn: "Ontari (ఒంటరి)", labelTe: "ఒంటరి" },
  { id: "kapu-turpu", labelEn: "Turpu Kapu (తుర్పు కాపు)", labelTe: "తుర్పు కాపు" },
  { id: "kapu-munnuru", labelEn: "Munnuru Kapu (మున్నూరు కాపు)", labelTe: "మున్నూరు కాపు" },
  { id: "kapu-general", labelEn: "General / All Kapu Sub-Castes (అన్ని కాపు శాఖలు)", labelTe: "అన్ని కాపు శాఖలు" }
];

export const CHOUDARY_SUB_CASTES: SubCasteInfo[] = [
  { id: "choudary-general", labelEn: "Choudary General (చౌదరి జనరల్)", labelTe: "చౌదరి జనరల్" }
];

export const BRAHMIN_GOTRAMS: GotramInfo[] = [
  { id: "brahmin-srivatsa", labelEn: "Srivatsa (శ్రీవత్స)", labelTe: "శ్రీవత్స" },
  { id: "brahmin-bharadwaja", labelEn: "Bharadwaja (భరద్వాజ)", labelTe: "భరద్వాజ" },
  { id: "brahmin-kasyapa", labelEn: "Kasyapa (కశ్యప)", labelTe: "కశ్యప" },
  { id: "brahmin-atreya", labelEn: "Atreya (ఆత్రేయ)", labelTe: "ఆత్రేయ" },
  { id: "brahmin-haritasa", labelEn: "Haritasa / Harita (హరితస)", labelTe: "హరితస" },
  { id: "brahmin-koundinya", labelEn: "Koundinya (కౌండిన్య)", labelTe: "కౌండిన్య" },
  { id: "brahmin-gautama", labelEn: "Gautama (గౌతమ)", labelTe: "గౌతమ" },
  { id: "brahmin-vasishtha", labelEn: "Vasishtha (వసిష్ఠ)", labelTe: "వసిష్ఠ" },
  { id: "brahmin-vishwamitra", labelEn: "Vishwamitra (విశ్వామిత్ర)", labelTe: "విశ్వామిత్ర" },
  { id: "brahmin-jamadagni", labelEn: "Jamadagni (జమదగ్ని)", labelTe: "జమదగ్ని" },
  { id: "brahmin-naidhruva", labelEn: "Naidhruva (నైధ్రువ)", labelTe: "నైధ్రువ" },
  { id: "brahmin-sandilya", labelEn: "Sandilya (శాండిల్య)", labelTe: "శాండిల్య" },
  { id: "brahmin-parasara", labelEn: "Parasara (పరాశర)", labelTe: "పరాశర" },
  { id: "brahmin-gargya", labelEn: "Gargya (గార్గ్య)", labelTe: "గార్గ్య" },
  { id: "brahmin-shatamarshana", labelEn: "Shatamarshana (శఠమర్షణ)", labelTe: "శఠమర్షణ" },
  { id: "brahmin-mudgala", labelEn: "Mudgala (ముద్గల)", labelTe: "ముద్గల" },
  { id: "brahmin-agastya", labelEn: "Agastya (అగస్త్య)", labelTe: "అగస్త్య" },
  { id: "brahmin-bhargava", labelEn: "Bhargava (భార్గవ)", labelTe: "భార్గవ" },
  { id: "brahmin-lohita", labelEn: "Lohita (లోహిత)", labelTe: "లోహిత" },
  { id: "brahmin-upamanyu", labelEn: "Upamanyu (ఉపమన్యు)", labelTe: "ఉపమన్యు" },
  { id: "brahmin-kausika", labelEn: "Kausika (కౌశిక)", labelTe: "కౌశిక" },
  { id: "brahmin-kanva", labelEn: "Kanva (కణ్వ)", labelTe: "కణ్వ" },
  { id: "brahmin-angirasa", labelEn: "Angirasa (అంగీరస)", labelTe: "అంగీరస" },
  { id: "brahmin-vatsa", labelEn: "Vatsa (వత్స)", labelTe: "వత్స" },
  { id: "brahmin-salankayana", labelEn: "Salankayana (సాలంకాయన)", labelTe: "సాలంకాయన" },
  { id: "brahmin-kapi", labelEn: "Kapi (కపి)", labelTe: "కపి" },
  { id: "brahmin-babhravya", labelEn: "Babhravya (బభ్రవ్య)", labelTe: "బభ్రవ్య" },
  { id: "brahmin-maudgalyasya", labelEn: "Maudgalyasya (మౌద్గల్యస)", labelTe: "మౌద్గల్యస" },
  { id: "brahmin-shounaka", labelEn: "Shounaka (శౌనక)", labelTe: "శౌనక" },
  { id: "brahmin-other-gotram", labelEn: "Other Gotram (ఇతర గోత్రం)", labelTe: "ఇతర గోత్రం" }
];

export const REDDY_GOTRAMS: GotramInfo[] = [
  { id: "reddy-siva-gotra", labelEn: "Siva Gotra (శివ గోత్రం)", labelTe: "శివ గోత్రం" },
  { id: "reddy-vishnu-gotra", labelEn: "Vishnu Gotra (విష్ణు గోత్రం)", labelTe: "విష్ణు గోత్రం" },
  { id: "reddy-surya-gotra", labelEn: "Surya Gotra (సూర్య గోత్రం)", labelTe: "సూర్య గోత్రం" },
  { id: "reddy-bharadwaja", labelEn: "Bharadwaja (భరద్వాజ గోత్రం)", labelTe: "భరద్వాజ" },
  { id: "reddy-kasyapa", labelEn: "Kasyapa (కశ్యప గోత్రం)", labelTe: "కశ్యప" },
  { id: "reddy-srivatsa", labelEn: "Srivatsa (శ్రీవత్స గోత్రం)", labelTe: "శ్రీవత్స" },
  { id: "reddy-atreya", labelEn: "Atreya (ఆత్రేయ గోత్రం)", labelTe: "ఆత్రేయ" },
  { id: "reddy-gautama", labelEn: "Gautama (గౌతమ గోత్రం)", labelTe: "గౌతమ" },
  { id: "reddy-other-gotram", labelEn: "Other / Family Intiperu Gotram (ఇతర గోత్రం)", labelTe: "ఇతర గోత్రం" }
];

export const GENERAL_GOTRAMS: GotramInfo[] = [
  ...BRAHMIN_GOTRAMS.map(g => ({ ...g, id: `general-${g.id}` })),
  { id: "general-siva-gotra", labelEn: "Siva Gotra (శివ గోత్రం)", labelTe: "శివ గోత్రం" },
  { id: "general-vishnu-gotra", labelEn: "Vishnu Gotra (విష్ణు గోత్రం)", labelTe: "విష్ణు గోత్రం" },
  { id: "general-gotra", labelEn: "General / Family Gotram (సాధారణ గోత్రం)", labelTe: "సాధారణ గోత్రం" }
];
