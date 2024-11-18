def fib(n, list = []):
    if len(list) >n:
        return list[n]
    if n == 1:
        list.append(1)
        return 1
    if n < 1:
        list.append(0)
        return 0
    m = fib(n-2, list) + fib(n-1, list)
    list.append(m)
    return m
if __name__ == '__main__':
    print(fib(998))