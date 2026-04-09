import * as Icons from '@ant-design/icons';
import * as Antd from 'antd';
import moment from 'moment';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

/**
 * react-runner 的 import 映射：生成代码中的 import 语句解析到此 scope。
 */
export function buildRunnerScope(): Record<string, unknown> {
  const reactModule = {
    ...React,
    default: React,
    useState,
    useEffect,
    useMemo,
    useCallback,
  };

  return {
    import: {
      react: reactModule,
      antd: Antd,
      '@ant-design/icons': Icons,
      moment,
    },
  };
}
