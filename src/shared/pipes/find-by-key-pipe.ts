import { Pipe, PipeTransform } from '@angular/core';

interface FindByKeyParams<T> {
  searchValue: unknown;
  searchKey: keyof T;
  displayKey: keyof T;
}

@Pipe({
  name: 'findByKey',
})
export class FindByKeyPipe implements PipeTransform {
  public transform<T>(items: T[], params: FindByKeyParams<T>): unknown {
    if (!params) {
      return '';
    }

    const { searchValue, searchKey, displayKey } = params;

    return items.find((item) => item[searchKey] === searchValue)?.[displayKey] ?? '';
  }
}
