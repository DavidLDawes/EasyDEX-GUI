import translate from '../translate/translate';

const zcashParamsCheckErrors = (zcashParamsExist) => {
  let _errors;

  if (zcashParamsExist.errors) {
    _errors = [translate('KMD_NATIVE.ZCASH_PARAMS_MISSING'), ''];

    if (!zcashParamsExist.rootDir) {
      _errors.push(translate('KMD_NATIVE.ZCASH_PARAMS_MISSING_ROOT_DIR'));
    }
    if (!zcashParamsExist.provingKey) {
      _errors.push(translate('KMD_NATIVE.ZCASH_PARAMS_MISSING_PROVING_KEY'));
    }
    if (!zcashParamsExist.verifyingKey) {
      _errors.push(translate('KMD_NATIVE.ZCASH_PARAMS_MISSING_VERIFYING_KEY'));
    }
    if (!zcashParamsExist.provingKeySize &&
        zcashParamsExist.provingKey) {
      _errors.push(translate('KMD_NATIVE.ZCASH_PARAMS_MISSING_PROVING_KEY_SIZE'));
    }
    if (!zcashParamsExist.verifyingKeySize &&
        zcashParamsExist.verifyingKey) {
      _errors.push(translate('KMD_NATIVE.ZCASH_PARAMS_MISSING_VERIFYING_KEY_SIZE'));
    }
    if (!zcashParamsExist.spend) {
    _errors.push(translate('KMD_NATIVE.ZCASH_PARAMS_MISSING_SPEND'));
    }
    if (!zcashParamsExist.output) {
    _errors.push(translate('KMD_NATIVE.ZCASH_PARAMS_MISSING_OUTPUT'));
    }
    if (!zcashParamsExist.groth16) {
    _errors.push(translate('KMD_NATIVE.ZCASH_PARAMS_MISSING_GROTH16'));
    }
  }

  return _errors;
}

export default zcashParamsCheckErrors;